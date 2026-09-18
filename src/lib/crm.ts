import "server-only";

const CRM_API_BASE_URL = "https://services.leadconnectorhq.com";
const CRM_API_VERSION = "v3";

/**
 * Marca blanca: la app nunca nombra al proveedor del CRM. Las variables de
 * entorno se llaman ORBITA_CRM_*; los nombres antiguos se siguen leyendo para
 * no romper despliegues existentes, pero nunca aparecen en mensajes de error.
 */
function readEnv(name: string, legacyName: string) {
  return (process.env[name] ?? process.env[legacyName])?.trim();
}

export class CrmConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrmConfigurationError";
  }
}

export interface CrmContactInput {
  name: string;
  email?: string | null;
  phone: string;
  cedula?: string | null;
  address?: string | null;
  city?: string | null;
  department?: string | null;
  source: string;
}

interface CrmContactResponse {
  contact?: { id?: string };
}

interface CrmNoteResponse {
  note?: { id?: string };
}

interface CrmMessageResponse {
  messageId?: string;
  conversationId?: string;
}

function getConfig() {
  const apiKey = readEnv("ORBITA_CRM_API_KEY", "GHL_API_KEY");
  const locationId = readEnv("ORBITA_CRM_LOCATION_ID", "GHL_LOCATION_ID");

  if (!apiKey || !locationId) {
    throw new CrmConfigurationError(
      "Configura ORBITA_CRM_API_KEY y ORBITA_CRM_LOCATION_ID para sincronizar contactos y enviar cotizaciones."
    );
  }

  return { apiKey, locationId };
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? fullName.trim(),
    lastName: parts.slice(1).join(" ") || undefined,
  };
}

export function normalizePhoneForCrm(phone: string): string {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (!digits) return "";
  if (trimmed.startsWith("+") || phone.trim().startsWith("00")) return `+${digits}`;

  const defaultCountryCode = (
    readEnv("ORBITA_CRM_DEFAULT_PHONE_COUNTRY_CODE", "GHL_DEFAULT_PHONE_COUNTRY_CODE") ?? "57"
  ).replace(/\D/g, "");
  if (digits.length === 10 && defaultCountryCode) return `+${defaultCountryCode}${digits}`;
  return `+${digits}`;
}

async function crmRequest<T>(path: string, init: RequestInit): Promise<T> {
  const { apiKey } = getConfig();
  const response = await fetch(`${CRM_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Version: CRM_API_VERSION,
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : `HTTP ${response.status}`;
    throw new Error(`El CRM de Órbita IA rechazó la solicitud: ${sanitizeDetail(detail)}`);
  }

  return (payload ?? {}) as T;
}

/**
 * El detalle viene del proveedor y puede nombrarlo; lo neutralizamos antes de
 * mostrarlo para mantener la marca blanca incluso en errores remotos.
 */
function sanitizeDetail(detail: string): string {
  return detail
    .replace(/high\s*-?\s*level/gi, "Órbita IA")
    .replace(/gohighlevel(\.com)?/gi, "Órbita IA")
    .replace(/leadconnectorhq?(\.com)?/gi, "Órbita IA")
    .replace(/leadconnector/gi, "Órbita IA")
    .replace(/msgsndr(\.com)?/gi, "Órbita IA")
    .replace(/\bghl\b/gi, "CRM")
    .slice(0, 300);
}

export async function upsertCrmContact(input: CrmContactInput): Promise<string> {
  const { locationId } = getConfig();
  const phone = normalizePhoneForCrm(input.phone);
  if (!phone) throw new Error("El teléfono no es válido para sincronizarlo con el CRM.");

  const { firstName, lastName } = splitName(input.name);
  const customFields: Array<{ id: string; fieldValue: string }> = [];
  const cedulaFieldId = readEnv("ORBITA_CRM_CEDULA_CUSTOM_FIELD_ID", "GHL_CEDULA_CUSTOM_FIELD_ID");
  if (cedulaFieldId && input.cedula) {
    customFields.push({ id: cedulaFieldId, fieldValue: input.cedula });
  }

  const response = await crmRequest<CrmContactResponse>("/contacts/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId,
      name: input.name.trim(),
      firstName,
      lastName,
      phone,
      email: input.email?.trim() || undefined,
      address1: input.address?.trim() || undefined,
      city: input.city?.trim() || undefined,
      state: input.department?.trim() || undefined,
      country: readEnv("ORBITA_CRM_CONTACT_COUNTRY", "GHL_CONTACT_COUNTRY") || "CO",
      source: input.source,
      createNewIfDuplicateAllowed: false,
      customFields: customFields.length > 0 ? customFields : undefined,
    }),
  });

  const contactId = response.contact?.id;
  if (!contactId) throw new Error("El CRM no devolvió el identificador del contacto.");
  return contactId;
}

export async function createCrmContactNote(contactId: string, title: string, body: string) {
  const response = await crmRequest<CrmNoteResponse>(
    `/contacts/${encodeURIComponent(contactId)}/notes`,
    {
      method: "POST",
      body: JSON.stringify({ title, body }),
    }
  );
  return response.note?.id ?? null;
}

/**
 * Tipo de canal con el que sale la cotización. `Custom` enruta el mensaje al
 * proveedor externo de SMS; `SMS` usa el proveedor que la subcuenta tenga
 * marcado como predeterminado. El número remitente siempre lo decide el
 * proveedor, por eso aquí no se envía `fromNumber`.
 */
type CrmMessageType = "Custom" | "SMS";

function getMessageChannel(): { type: CrmMessageType; conversationProviderId?: string } {
  const configured = readEnv("ORBITA_CRM_MESSAGE_TYPE", "GHL_MESSAGE_TYPE");
  const type: CrmMessageType = configured?.toLowerCase() === "sms" ? "SMS" : "Custom";
  const conversationProviderId = readEnv(
    "ORBITA_CRM_CONVERSATION_PROVIDER_ID",
    "GHL_CONVERSATION_PROVIDER_ID"
  );

  // Un proveedor adicional (no el predeterminado) solo recibe el mensaje si se
  // indica su id; sin él la cotización se enviaría por el canal equivocado.
  if (type === "Custom" && !conversationProviderId) {
    throw new CrmConfigurationError(
      "Configura ORBITA_CRM_CONVERSATION_PROVIDER_ID con el id del proveedor de SMS, " +
        "o define ORBITA_CRM_MESSAGE_TYPE=SMS si ese proveedor ya es el predeterminado de la subcuenta."
    );
  }

  return { type, conversationProviderId };
}

export async function sendCrmQuoteMessage(contactId: string, message: string) {
  const { type, conversationProviderId } = getMessageChannel();

  const response = await crmRequest<CrmMessageResponse>("/conversations/messages", {
    method: "POST",
    body: JSON.stringify({
      type,
      contactId,
      message,
      status: "pending",
      conversationProviderId: conversationProviderId || undefined,
    }),
  });

  if (!response.messageId) {
    throw new Error("El CRM no confirmó la creación del mensaje.");
  }

  return {
    messageId: response.messageId,
    conversationId: response.conversationId ?? null,
  };
}
