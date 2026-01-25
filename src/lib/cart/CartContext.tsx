import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  description?: string | null;
};

export type CartLine = CartItem & {
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem, quantity?: number) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "smartcanteen:cart";

function safeParseLines(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => {
        if (!x || typeof x !== "object") return null;
        const obj = x as Record<string, unknown>;
        const id = typeof obj.id === "string" ? obj.id : null;
        const name = typeof obj.name === "string" ? obj.name : null;
        const price = typeof obj.price === "number" ? obj.price : Number(obj.price);
        const quantity = typeof obj.quantity === "number" ? obj.quantity : Number(obj.quantity);
        const image = typeof obj.image === "string" ? obj.image : null;
        const description = typeof obj.description === "string" ? obj.description : null;
        if (!id || !name || !Number.isFinite(price) || !Number.isFinite(quantity)) return null;
        return {
          id,
          name,
          price,
          quantity: Math.max(1, Math.floor(quantity)),
          image,
          description,
        } satisfies CartLine;
      })
      .filter(Boolean) as CartLine[];
  } catch {
    return [];
  }
}

function writeLines(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      return safeParseLines(localStorage.getItem(STORAGE_KEY));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    writeLines(lines);
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    return {
      lines,
      itemCount,
      subtotal,
      addItem: (item: CartItem, quantity: number = 1) => {
        const qty = Math.max(1, Math.floor(quantity));
        setLines((prev) => {
          const idx = prev.findIndex((x) => x.id === item.id);
          if (idx === -1) {
            return [...prev, { ...item, quantity: qty }];
          }
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          return next;
        });
      },
      removeItem: (id: string) => setLines((prev) => prev.filter((x) => x.id !== id)),
      setQuantity: (id: string, quantity: number) => {
        const qty = Math.max(1, Math.floor(quantity));
        setLines((prev) => prev.map((x) => (x.id === id ? { ...x, quantity: qty } : x)));
      },
      clear: () => setLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
