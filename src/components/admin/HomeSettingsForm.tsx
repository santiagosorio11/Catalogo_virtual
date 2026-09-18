"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateStoreSettings, uploadStoreBanner, uploadStoreLogo } from "@/actions/settings";
import { useToast } from "@/components/ui/Toast";
import type { StoreSettings } from "@/lib/types";

export function HomeSettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const toast = useToast();
  const [storeName, setStoreName] = useState(settings.store_name);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url);
  const [bannerUrl, setBannerUrl] = useState(settings.banner_url);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleAssetChange(
    event: React.ChangeEvent<HTMLInputElement>,
    asset: "logo" | "banner"
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const label = asset === "logo" ? "logo" : "banner";
    setUploading(asset);
    const toastId = toast.loading(`Subiendo ${label}...`, { description: file.name });

    const formData = new FormData();
    formData.append("file", file);
    const result = asset === "logo"
      ? await uploadStoreLogo(formData)
      : await uploadStoreBanner(formData);

    setUploading(null);
    event.target.value = "";

    if ("error" in result) {
      toast.update(toastId, {
        variant: "error",
        title: `No se pudo subir el ${label}`,
        description: result.error,
      });
      return;
    }

    if (asset === "logo") setLogoUrl(result.url ?? null);
    else setBannerUrl(result.url ?? null);

    toast.update(toastId, {
      variant: "success",
      title: `${asset === "logo" ? "Logo" : "Banner"} actualizado`,
      description: null,
    });
    router.refresh();
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateStoreSettings({
      storeName,
      description: settings.description,
      whatsappNumber: settings.whatsapp_number,
    });
    setSaving(false);

    if ("error" in result) {
      toast.error("No se pudo guardar la portada", { description: result.error });
      return;
    }

    toast.success("Portada actualizada", { description: storeName.trim() });
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
            disabled={uploading === "logo"}
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
          >
            {uploading === "logo" ? "Subiendo..." : "Cambiar logo"}
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleAssetChange(event, "logo")}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black/60">Banner</h2>
        <div className="relative mb-3 h-32 w-full overflow-hidden rounded-lg bg-black/5">
          {bannerUrl && <Image src={bannerUrl} alt="" fill className="object-cover" />}
        </div>
        <button
          onClick={() => bannerInputRef.current?.click()}
          disabled={uploading === "banner"}
          className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
        >
          {uploading === "banner" ? "Subiendo..." : "Cambiar banner"}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleAssetChange(event, "banner")}
        />
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
