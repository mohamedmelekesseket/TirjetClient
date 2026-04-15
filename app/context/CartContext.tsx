"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const token = () => (session as any)?.apiToken as string | undefined;

  const fetchCart = useCallback(async () => {
    const t = token();
    if (!t) { setCart({ items: [], total: 0 }); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/cart`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) setCart(await res.json());
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    const t = token();
    if (!t) throw new Error("Not authenticated");
    const res = await fetch(`${API}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ productId, quantity }),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    setCart(await res.json());
  };

  const updateItem = async (productId: string, quantity: number) => {
    const t = token();
    if (!t) return;
    const res = await fetch(`${API}/api/cart/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ quantity }),
    });
    if (res.ok) setCart(await res.json());
  };

  const removeItem = async (productId: string) => {
    const t = token();
    if (!t) return;
    const res = await fetch(`${API}/api/cart/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.ok) setCart(await res.json());
  };

  const clearCart = async () => {
    const t = token();
    if (!t) return;
    const res = await fetch(`${API}/api/cart`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.ok) setCart({ items: [], total: 0 });
  };

  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, fetchCart, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}