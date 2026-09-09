"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatCOP } from "@/lib/currency";
import { buildOrderSummaryText, buildWhatsAppLink } from "@/lib/whatsapp";
import { createOrder } from "@/actions/orders";
import type { DeliveryMethod } from "@/lib/types";

export function CheckoutForm({ whatsappNumber }: { whatsappNumber: string | null }) {
  const { items, subtotal, clear } = useCart();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("domicilio");
  const [name, setName] = useState("");
  const [cedula, setCedula] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [city, setCity] = useState("");
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ orderNumber: number; whatsappLink: string | null } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);

    const result = await createOrder({
      customerName: name,
      customerCedula: cedula,
      customerPhone: phone,
      deliveryMethod,
      address: deliveryMethod === "domicilio" ? address : undefined,
      addressDetails: deliveryMethod === "domicilio" ? addressDetails : undefined,
      city: deliveryMethod === "domicilio" ? city : undefined,
      department: deliveryMethod === "domicilio" ? department : undefined,
      notes,
      items,
    });

    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    let whatsappLink: string | null = null;
    if (whatsappNumber) {
      const text = buildOrderSummaryText({
        orderNumber: result.orderNumber,
        customerName: name,
        customerCedula: cedula,
        customerPhone: phone,
        deliveryMethod,
        address,
        addressDetails,
        city,
        department,
        notes,
        items,
        subtotal: result.subtotal,
      });
      whatsappLink = buildWhatsAppLink(whatsappNumber, text);
      // Best-effort: many browsers block window.open() once it follows an
      // await, so the button below is the reliable fallback.
      window.open(whatsappLink, "_blank");
    }

    setConfirmation({ orderNumber: result.orderNumber, whatsappLink });
    clear();
  }

  if (confirmation) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-2xl">
          ✓
        </div>
        <h1 className="text-xl font-semibold">¡Pedido #{confirmation.orderNumber} recibido!</h1>
        <p className="mt-2 text-sm text-black/50">
          {confirmation.whatsappLink
            ? "Confirma el envío del resumen de tu pedido por WhatsApp."
            : "Guarda tu número de pedido para hacerle seguimiento."}
        </p>

        {confirmation.whatsappLink && (
          <a
            href={confirmation.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Enviar por WhatsApp
          </a>
        )}
        <Link
          href="/"
          className="mt-3 text-sm font-medium text-black/50 hover:text-black"
        >
          Volver al catálogo
        </Link>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center">
        <p className="text-sm text-black/40">Tu carrito está vacío.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-brand">
          Ir al catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <Link
        href="/carrito"
        className="mb-4 inline-flex items-center gap-1 text-sm text-black/50 hover:text-black"
      >
        <ArrowLeft size={16} /> Volver al carrito
      </Link>

      <h1 className="mb-5 text-xl font-semibold">Finalizar pedido</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-black/60">Tus datos</h2>
          <input
            required
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <input
            required
            placeholder="Número de cédula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <input
            required
            placeholder="WhatsApp / Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-black/60">Entrega</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryMethod("domicilio")}
              className={clsx(
                "rounded-lg border px-3 py-2.5 text-sm font-medium",
                deliveryMethod === "domicilio"
                  ? "border-brand bg-brand-light text-brand"
                  : "border-black/10 text-black/60"
              )}
            >
              Domicilio
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod("recoger")}
              className={clsx(
                "rounded-lg border px-3 py-2.5 text-sm font-medium",
                deliveryMethod === "recoger"
                  ? "border-brand bg-brand-light text-brand"
                  : "border-black/10 text-black/60"
              )}
            >
              Recoger en tienda
            </button>
          </div>

          {deliveryMethod === "domicilio" && (
            <div className="space-y-3">
              <input
                required
                placeholder="Dirección"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <input
                placeholder="Detalles (apto, torre, barrio...)"
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Ciudad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
                <input
                  placeholder="Departamento"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
          )}
        </section>

        <section>
          <textarea
            placeholder="Notas del pedido (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </section>

        <div className="rounded-lg bg-black/[0.03] p-4">
          <div className="flex justify-between text-sm">
            <span className="text-black/50">Total</span>
            <span className="font-semibold">{formatCOP(subtotal)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Enviando..." : "Finalizar pedido por WhatsApp"}
        </button>
      </form>
    </main>
  );
}
