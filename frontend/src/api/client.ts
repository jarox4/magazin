import type { Product, Category, Order, User } from '../types';

const BASE = '/api';

function getToken() { return localStorage.getItem('token'); }

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const tok = getToken();
  if (tok) headers['Authorization'] = `Bearer ${tok}`;
  const res = await fetch(BASE + path, { headers, ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Запрос неудачен');
  }
  return res.json();
}

// Auth
export const apiRegister = (data: { email: string; password: string; full_name: string; phone?: string; address?: string }) =>
  req<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const apiLogin = (email: string, password: string) =>
  req<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const apiGetMe = () => req<User>('/me');
export const apiUpdateMe = (data: { full_name: string; phone: string; address: string }) =>
  req<User>('/me', { method: 'PUT', body: JSON.stringify(data) });

// Products (public)
export const apiGetProducts = (params?: { category?: number; search?: string }) => {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', String(params.category));
  if (params?.search)   q.set('search', params.search);
  return req<Product[]>('/products' + (q.toString() ? '?' + q : ''));
};
export const apiGetProduct = (id: number) => req<Product>(`/products/${id}`);
export const apiGetCategories = () => req<Category[]>('/categories');

// Orders
export const apiGetOrders = () => req<Order[]>('/orders');
export const apiGetOrder = (id: number) => req<Order>(`/orders/${id}`);
export const apiCreateOrder = (data: { address: string; phone: string; notes?: string; items: { inventory_id: number; quantity: number }[] }) =>
  req<Order>('/orders', { method: 'POST', body: JSON.stringify(data) });
export const apiCancelOrder = (id: number) =>
  req<{ updated: boolean }>(`/orders/${id}`, { method: 'DELETE' });

export const apiGetAllOrders = () =>
  req<Order[]>('/admin/orders');
