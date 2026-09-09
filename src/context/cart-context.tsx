"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "catalogo-virtual-cart";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clear: () => void;
  subtotal: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function itemKey(productId: string, variantId: string | null) {
  return `${productId}::${variantId ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Restoring browser state after hydration is intentional for this client-only cart.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable; cart just won't persist
    }
  }, [items, hydrated]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const key = itemKey(newItem.productId, newItem.variantId);
      const existing = prev.find((i) => itemKey(i.productId, i.variantId) === key);
      if (existing) {
        return prev.map((i) =>
          itemKey(i.productId, i.variantId) === key
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId: string | null) => {
    const key = itemKey(productId, variantId);
    setItems((prev) => prev.filter((i) => itemKey(i.productId, i.variantId) !== key));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      const key = itemKey(productId, variantId);
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => itemKey(i.productId, i.variantId) !== key)
          : prev.map((i) =>
              itemKey(i.productId, i.variantId) === key ? { ...i, quantity } : i
            )
      );
    },
    []
  );

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clear, subtotal, totalQuantity }),
    [items, addItem, removeItem, updateQuantity, clear, subtotal, totalQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
