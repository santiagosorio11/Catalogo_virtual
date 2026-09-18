import "server-only";

const GHL_API_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "v3";

export class GhlConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GhlConfigurationError";
  }
}

export interface GhlContactInput {
  name: string;
  email?: string | null;
  phone: string;
  cedula?: string | null;
  address?: string | null;
  city?: string | null;
  department?: string | null;
  source: string;
}

interface GhlContactResponse {
  contact?: { id?: string };
}

interface GhlNoteResponse {
  note?: { id?: string };
}

interface GhlMessageResponse {
  messageId?: string;
  conversationId?: string;
}

function getConfig() {
  const apiKey = process.env.GHL_API_KEY?.trim();
  const locationId = process.env.GHL_LOCATION_ID?.trim();

  if (!apiKey || !locationId) {
    throw new GhlConfigurationError(
      "Configura GHL_API_KEY y GHL_LOCATION_ID para sincronizar contactos y enviar cotizaciones."
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

export function normalizePhoneForGhl(phone: string): string {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (!digits) return "";
  if (trimmed.startsWith("+") || phone.trim().startsWith("00")) return `+${digits}`;

  const defaultCountryCode = (process.env.GHL_DEFAULT_PHONE_COUNTRY_CODE ?? "57").replace(
    /\D/g,
    ""
  );
  if (digits.length === 10 && defaultCountryCode) return `+${defaultCountryCode}${digits}`;
  return `+${digits}`;
}

async function ghlRequest<T>(path: string, init: RequestInit): Promise<T> {
  const { apiKey } = getConfig();
  const response = await fetch(`${GHL_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Version: GHL_API_VERSION,
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
    throw new Error(`HighLevel rechazó la solicitud: ${detail.slice(0, 300)}`);
  }

  return (payload ?? {}) as T;
}

export async function upsertGhlContact(input: GhlContactInput): Promise<string> {
  const { locationId } = getConfig();
  const phone = normalizePhoneForGhl(input.phone);
  if (!phone) throw new Error("El teléfono no es válido para sincronizarlo con HighLevel.");

  const { firstName, lastName } = splitName(input.name);
  const customFields: Array<{ id: string; fieldValue: string }> = [];
  const cedulaFieldId = process.env.GHL_CEDULA_CUSTOM_FIELD_ID?.trim();
  if (cedulaFieldId && input.cedula) {
    customFields.push({ id: cedulaFieldId, fieldValue: input.cedula });
  }

  const response = await ghlRequest<GhlContactResponse>("/contacts/upsert", {
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
      country: process.env.GHL_CONTACT_COUNTRY?.trim() || "CO",
      source: input.source,
      createNewIfDuplicateAllowed: false,
      customFields: customFields.length > 0 ? customFields : undefined,
    }),
  });

  const contactId = response.contact?.id;
  if (!contactId) throw new Error("HighLevel no devolvió el identificador del contacto.");
  return contactId;
}

export async function createGhlContactNote(contactId: string, title: string, body: string) {
  const response = await ghlRequest<GhlNoteResponse>(
    `/contacts/${encodeURIComponent(contactId)}/notes`,
    {
      method: "POST",
      body: JSON.stringify({ title, body }),
    }
  );
  return response.note?.id ?? null;
}

export async function sendGhlWhatsappMessage(contactId: string, message: string) {
  const fromNumber = process.env.GHL_WHATSAPP_FROM_NUMBER?.trim();
  const conversationProviderId = process.env.GHL_CONVERSATION_PROVIDER_ID?.trim();

  const response = await ghlRequest<GhlMessageResponse>("/conversations/messages", {
    method: "POST",
    body: JSON.stringify({
      type: "WhatsApp",
      contactId,
      message,
      status: "pending",
      fromNumber: fromNumber || undefined,
      conversationProviderId: conversationProviderId || undefined,
    }),
  });

  if (!response.messageId) {
    throw new Error("HighLevel no confirmó la creación del mensaje de WhatsApp.");
  }

  return {
    messageId: response.messageId,
    conversationId: response.conversationId ?? null,
  };
}
