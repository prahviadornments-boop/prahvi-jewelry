import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Product, StoreSettings, OrderItem } from '../types';
import { toast } from 'sonner';

// --- Cart Context ---

interface CartContextType {
  cart: OrderItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      const newQuantity = existing ? existing.quantity + quantity : quantity;

      if (newQuantity > product.stock) {
        toast.error(`Only ${product.stock} items available in stock.`);
        return prev;
      }

      toast.success("Added to cart!");
      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity, image: product.images[0], stock: product.stock }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        // Only check stock if increasing quantity
        if (quantity > item.quantity && item.stock !== undefined && item.stock !== null && quantity > item.stock) {
          toast.error(`Only ${item.stock} items available in stock.`);
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

// --- Wishlist Context ---

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setWishlist(userDoc.data().wishlist || []);
        }
      } else {
        setWishlist([]);
      }
    });
  }, []);

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast.error("Please login to save items to your wishlist");
      return;
    }

    const isAdding = !wishlist.includes(productId);
    const newWishlist = isAdding
      ? [...wishlist, productId]
      : wishlist.filter(id => id !== productId);

    setWishlist(newWishlist);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        wishlist: newWishlist
      });
      toast.success(isAdding ? "Added to wishlist" : "Removed from wishlist");
    } catch (error) {
      toast.error("Failed to update wishlist");
      setWishlist(wishlist); // Rollback
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

// --- Settings Context ---

interface SettingsContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: StoreSettings) => Promise<void>;
  loading: boolean;
}

const defaultSettings: StoreSettings = {
  siteName: 'Prahvi Jewelry',
  siteDescription: 'Premium Style. Affordable Luxury.',
  address: '123 Jewelry Lane, Diamond District, New York, NY 10001',
  phone: '+1 (555) 123-4567',
  email: 'hello@prahvi.com',
  workingHours: 'Mon - Sat: 10am - 7pm',
  instagram: '#',
  facebook: '#',
  whatsapp: '+15551234567',
  hero: {
    title: 'Elevate Your Everyday Style',
    subtitle: 'Premium Style. Affordable Luxury.',
    description: 'Modern, trendy jewellery designed to elevate your everyday style. Shine effortlessly from daily wear to special occasions without overspending.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2000'
  },
  about: {
    title: 'Our Story',
    content: 'Prahvi Jewelry was born out of a passion for creating beautiful, high-quality jewelry that everyone can afford. We believe that luxury should be accessible, not exclusive. Our pieces are carefully crafted to bring a touch of elegance to your everyday life.',
    image: 'https://images.unsplash.com/photo-1573408302185-06ff321cf6e6?auto=format&fit=crop&q=80&w=1000'
  },
  categorySection: {
    title: 'Shop by Category',
    description: 'Explore our diverse range of jewelry pieces, each category telling its own unique story of luxury.'
  },
  newsletter: {
    title: 'Join the World of Prahvi',
    description: 'Subscribe to receive updates, access to exclusive deals, and more.'
  },
  featuredSection: {
    title: 'Featured Pieces',
    description: 'Our most coveted designs, handpicked for their exceptional craftsmanship.'
  },
  features: [
    { icon: 'Star', title: "Premium Quality", desc: "Certified diamonds & 18k gold" },
    { icon: 'Truck', title: "Free Shipping", desc: "On all orders over $500" },
    { icon: 'Shield', title: "Secure Payment", desc: "100% encrypted transactions" },
    { icon: 'RefreshCcw', title: "Easy Returns", desc: "30-day money back guarantee" },
  ],
  paymentModes: {
    whatsapp: true,
    card: true,
    upi: true
  },
  upiId: '',
  upiQrCode: ''
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'store'));
        if (docSnap.exists()) {
          setSettings(docSnap.data() as StoreSettings);
        } else {
          await setDoc(doc(db, 'settings', 'store'), defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: StoreSettings) => {
    try {
      await setDoc(doc(db, 'settings', 'store'), newSettings);
      setSettings(newSettings);
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update settings.");
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

// --- Auth Hook ---

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDocRef = doc(db, 'users', u.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: u.email,
            displayName: u.displayName,
            role: 'user',
            wishlist: []
          });
          setIsAdmin(u.email === "kabbachiraponnappa@gmail.com" || u.email === "prahviadornments@gmail.com");
        } else {
          setIsAdmin(userDoc.data()?.role === 'admin' || u.email === "kabbachiraponnappa@gmail.com" || u.email === "prahviadornments@gmail.com");
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  return { user, isAdmin, loading };
};
