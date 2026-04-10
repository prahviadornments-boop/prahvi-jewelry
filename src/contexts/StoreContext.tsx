import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Product, StoreSettings, OrderItem } from '../types';
import { toast } from 'sonner';

// --- Cart Context ---

interface CartContextType {
  cart: OrderItem[];
  addToCart: (product: Product) => void;
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

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, image: product.images[0] }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ));
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
  address: '123 Jewelry Lane, Diamond District, New York, NY 10001',
  phone: '+1 (555) 123-4567',
  email: 'hello@prahvi.com',
  workingHours: 'Mon - Sat: 10am - 7pm',
  instagram: '#',
  facebook: '#',
  whatsapp: '+15551234567',
  features: [
    { icon: 'Star', title: "Premium Quality", desc: "Certified diamonds & 18k gold" },
    { icon: 'Truck', title: "Free Shipping", desc: "On all orders over $500" },
    { icon: 'Shield', title: "Secure Payment", desc: "100% encrypted transactions" },
    { icon: 'RefreshCcw', title: "Easy Returns", desc: "30-day money back guarantee" },
  ],
  paymentModes: {
    whatsapp: true,
    card: true
  }
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
