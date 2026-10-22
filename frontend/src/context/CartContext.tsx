import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '../types';

interface CartCtx {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  remove: (productId: number) => void;
  setQty: (productId: number, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const Ctx = createContext<CartCtx>({} as CartCtx);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (product: Product, qty = 1) => {
    setItems(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) return prev.map(i => i.product.id === product.id
        ? { ...i, quantity: Math.min(i.quantity + qty, product.quantity) } : i);
      return [...prev, { product, quantity: qty }];
    });
  };

  const remove = (productId: number) =>
    setItems(prev => prev.filter(i => i.product.id !== productId));

  const setQty = (productId: number, qty: number) => {
    if (qty <= 0) { remove(productId); return; }
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, total, count }}>{children}</Ctx.Provider>;
}

export const useCart = () => useContext(Ctx);
