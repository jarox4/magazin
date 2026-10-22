export interface Product {
  id: number;
  inventory_number: string;
  category_id: number;
  category_name: string;
  name: string;
  manufacturer_id: number;
  manufacturer_name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  description?: string | null;
}

export interface Category { id: number; name: string; }

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  role: 'customer' | 'admin';
}

export interface OrderItem {
  id: number;
  inventory_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  user_id: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_price: number;
  address: string;
  phone: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
