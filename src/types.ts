export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  featured: boolean;
  createdAt: any;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: any;
}

export interface Policy {
  id: string;
  title: string;
  content: string;
  type: 'shipping' | 'return' | 'privacy' | 'terms';
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: any;
}

export interface StoreSettings {
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
}
