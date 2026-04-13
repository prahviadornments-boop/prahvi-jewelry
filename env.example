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
  specs?: { [key: string]: string };
  labels?: string[];
  videoUrl?: string;
  relatedProductIds?: string[];
  sizes?: string[];
  weight?: number; // in kg
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
  selectedSize?: string;
  weight?: number; // in kg
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'whatsapp' | 'card' | 'upi';
  paymentScreenshot?: string;
  trackingNumber?: string;
  trackingLink?: string;
  isAbandoned?: boolean;
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
  announcementBar?: {
    text: string;
    link?: string;
    enabled: boolean;
  };
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
  testimonials?: {
    name: string;
    content: string;
    rating: number;
    image?: string;
  }[];
  quickLinks?: { name: string; path: string }[];
  paymentModes: {
    whatsapp: boolean;
    card: boolean;
    upi: boolean;
  };
  upiId?: string;
  upiQrCode?: string;
  shipping: {
    freeThreshold: number;
    flatRate: number;
    pincodeRates?: { [pincode: string]: number };
  };
  instagramGallery?: {
    title: string;
    description: string;
    images: { url: string; link?: string }[];
  };
  categoryVisibility?: { [key: string]: boolean };
}
