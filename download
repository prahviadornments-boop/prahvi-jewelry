export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
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
  stock: number;
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
  trackingNumber?: string;
  trackingLink?: string;
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
  phone: string;
  subject: string;
  message: string;
  createdAt: any;
}

export interface Feature {
  icon: string;
  title: string;
  desc: string;
}

export interface StoreSettings {
  siteName: string;
  siteDescription: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  hero: {
    title: string;
    subtitle: string;
    description: string;
    image: string;
  };
  about: {
    title: string;
    content: string;
    image: string;
  };
  categorySection: {
    title: string;
    description: string;
  };
  newsletter: {
    title: string;
    description: string;
  };
  featuredSection: {
    title: string;
    description: string;
  };
  features: Feature[];
  quickLinks?: { name: string; path: string }[];
  paymentModes: {
    whatsapp: boolean;
    card: boolean;
    upi: boolean;
  };
  upiId?: string;
  upiQrCode?: string;
}
