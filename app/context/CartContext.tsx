"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  product: {
    _id: string;
    title: string;
    images: string[];
    price: number;
    stock: number;
    artisan?: { name: string; city?: string };
  };
  quantity: number;
  price: number;
}

interface Cart {
  _id?: string;
  items: CartItem[];
  total: number;
}

interface CartContextType {
  cart: Cart;
  cartCount: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | null>(null); // ← was missing

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const apiToken = (session as any)?.apiToken as string | undefined;

  const fetchCart = useCallback(async () => {
    if (!apiToken) {
      setCart({ items: [], total: 0 });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/cart`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (res.ok) setCart(await res.json());
      else setCart({ items: [], total: 0 });
    } catch (err) {
      console.warn("Cart fetch failed:", err);
      setCart({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [apiToken]);

  useEffect(() => {
    if (status === "loading") return;
    fetchCart();
  }, [fetchCart, status]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!apiToken) throw new Error("Not authenticated");
    try {
      const res = await fetch(`${API}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify({ productId, quantity }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setCart(await res.json());
    } catch (err) {
      console.warn("addToCart failed:", err);
      throw err;
    }
  };

  const updateItem = async (productId: string, quantity: number) => {
    if (!apiToken) return;
    try {
      const res = await fetch(`${API}/api/cart/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) setCart(await res.json());
    } catch (err) {
      console.warn("updateItem failed:", err);
    }
  };

  const removeItem = async (productId: string) => {
    if (!apiToken) return;
    try {
      const res = await fetch(`${API}/api/cart/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (res.ok) setCart(await res.json());
    } catch (err) {
      console.warn("removeItem failed:", err);
    }
  };

  const clearCart = async () => {
    if (!apiToken) return;
    try {
      const res = await fetch(`${API}/api/cart`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (res.ok) setCart({ items: [], total: 0 });
    } catch (err) {
      console.warn("clearCart failed:", err);
    }
  };

  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, fetchCart, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}