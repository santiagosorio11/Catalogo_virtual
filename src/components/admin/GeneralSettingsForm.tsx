"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStoreSettings } from "@/actions/settings";
import type { StoreSettings } from "@/lib/types";

export function GeneralSettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [description, setDescription] = useState(settings.description ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSave() {
    setSaving(true);
    await updateStoreSettings({
      storeName: settings.store_name,
      description: description.trim() || null,
      whatsappNumber: whatsappNumber.trim() || null,
    });
    setSaving(false);
    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black/60">
          Número de WhatsApp de la tienda
        </h2>
        <p className="mb-2 text-xs text-black/40">
          Formato internacional, solo dígitos, sin espacios ni +. Ejemplo: 573001234567. Este
          número se usa como respaldo cuando todavía no hay sedes activas configuradas.
        </p>
        <input
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="573001234567"
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black/60">Descripción de la tienda</h2>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black/60">Moneda</h2>
        <p className="text-sm text-black/60">{settings.currency}</p>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
      {savedAt && <span className="ml-3 text-sm text-black/40">Guardado</span>}
    </div>
  );
}
