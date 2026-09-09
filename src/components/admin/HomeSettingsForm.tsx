"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateStoreSettings, uploadStoreBanner, uploadStoreLogo } from "@/actions/settings";
import type { StoreSettings } from "@/lib/types";

export function HomeSettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(settings.store_name);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url);
  const [bannerUrl, setBannerUrl] = useState(settings.banner_url);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadStoreLogo(formData);
    if ("url" in result) setLogoUrl(result.url ?? null);
    router.refresh();
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadStoreBanner(formData);
    if ("url" in result) setBannerUrl(result.url ?? null);
    router.refresh();
  }

  async function handleSave() {
    setSaving(true);
    await updateStoreSettings({
      storeName,
      description: settings.description,
      whatsappNumber: settings.whatsapp_number,
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black/60">Logo</h2>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-black/5">
            {logoUrl && <Image src={logoUrl} alt="" fill className="object-cover" />}
          </div>
          <button
            onClick={() => logoInputRef.current?.click()}
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Cambiar logo
          </button>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black/60">Banner</h2>
        <div className="relative mb-3 h-32 w-full overflow-hidden rounded-lg bg-black/5">
          {bannerUrl && <Image src={bannerUrl} alt="" fill className="object-cover" />}
        </div>
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
        >
          Cambiar banner
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black/60">Nombre de la tienda</h2>
        <input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
