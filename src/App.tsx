import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, storage, loginWithGoogle, logout } from './firebase';
import { doc, getDoc, collection, query, where, limit, getDocs, addDoc, serverTimestamp, updateDoc, deleteDoc, orderBy, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Toaster, toast } from 'sonner';
import * as LucideIcons from 'lucide-react';
import { ShoppingCart, User as UserIcon, Menu, X, Phone, Instagram, Facebook, Mail, MapPin, ChevronRight, Star, Trash2, Plus, Minus, Heart, Shield, Truck, RefreshCcw, LayoutDashboard, Package, ListTree, ShoppingBag, MessageSquare, Settings, LogOut, ExternalLink, Upload, AlertTriangle, TrendingUp, CreditCard, Sparkles, Coins, Diamond, Flower, Circle, Watch, Hexagon, Gift, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, Category, Order, Review, Policy, ContactMessage, OrderItem, StoreSettings, Feature } from './types';
import { ProductCard } from './components/ProductCard';
import { CartProvider, WishlistProvider, SettingsProvider, useCart, useWishlist, useSettings, useAuth } from './contexts/StoreContext';

// --- Components ---

// --- Components ---

const Breadcrumbs = ({ items }: { items: { name: string; path?: string }[] }) => {
  return (
    <nav className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-8 overflow-x-auto whitespace-nowrap pb-2">
      <Link to="/" className="hover:text-gold-600 transition-colors">Home</Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={12} className="shrink-0" />
          {item.path ? (
            <Link to={item.path} className="hover:text-gold-600 transition-colors">{item.name}</Link>
          ) : (
            <span className="text-gray-900">{item.name}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const uploadToImgBB = async (file: File) => {
  const apiKey = (import.meta as any).env.VITE_IMGBB_API_KEY || '1ee43179b21bce887d7a14af6e26f788';
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  if (result.success) {
    return result.data.url;
  } else {
    throw new Error(result.error?.message || 'Upload failed');
  }
};

const AnnouncementBar = () => {
  const { settings } = useSettings();
  if (!settings?.announcementBar?.enabled) return null;

  return (
    <div className="bg-gray-900 text-white py-2 px-4 text-center text-xs font-medium tracking-wider uppercase">
      {settings.announcementBar.link ? (
        <Link to={settings.announcementBar.link} className="hover:underline">
          {settings.announcementBar.text}
        </Link>
      ) : (
        <span>{settings.announcementBar.text}</span>
      )}
    </div>
  );
};

const OrderTracking = () => {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOrder(null);
    try {
      const q = query(
        collection(db, 'orders'),
        where('id', '==', orderId),
        where('customerPhone', '==', phone)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setOrder(snap.docs[0].data() as Order);
      } else {
        toast.error("Order not found. Please check your details.");
      }
    } catch (error) {
      toast.error("Error tracking order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-40 pb-20 max-w-4xl mx-auto px-4">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">Track Your Order</h1>
        <p className="text-gray-500">Enter your order details to see the current status.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl mb-12">
        <form onSubmit={handleTrack} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Order ID</label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. ORD-123456"
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-gold-400 transition-all font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-gold-400 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gold-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>
      </div>

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-8">
            <div>
              <p className="text-xs font-bold text-gold-600 uppercase tracking-widest">Order Status</p>
              <h2 className="text-2xl font-serif font-bold text-gray-900 capitalize">{order.status}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Placed On</p>
              <p className="font-medium">{order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="font-serif font-bold text-xl">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <img src={item.image} className="w-16 h-16 rounded-xl object-contain bg-gray-50" alt="" />
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-serif font-bold text-xl">Shipping Details</h3>
              <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Address</p>
                  <p className="text-sm text-gray-700">
                    {order.shippingAddress.addressLine1}, {order.shippingAddress.addressLine2 && `${order.shippingAddress.addressLine2}, `}
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                </div>
                {order.trackingNumber && (
                  <div>
                    <p className="text-xs font-bold text-gold-600 uppercase tracking-widest">Tracking Details</p>
                    <p className="text-sm font-bold text-gray-900">ID: {order.trackingNumber}</p>
                    {order.trackingLink && (
                      <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" className="text-gold-600 text-sm hover:underline flex items-center space-x-1 mt-1">
                        <span>Track Package</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const WhatsAppButton = () => {
  const { settings } = useSettings();
  if (!settings?.whatsapp) return null;

  const whatsappUrl = `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-[100] bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all hover:scale-110 group"
      aria-label="Chat on WhatsApp"
    >
      <LucideIcons.MessageCircle size={28} />
      <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
        Chat with us!
      </span>
    </a>
  );
};

const Navbar = () => {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Our Story', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <AnnouncementBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-lg sm:text-2xl font-serif font-bold tracking-tighter text-gray-900 uppercase">
              {(settings?.siteName || 'Prahvi').split(' ')[0]}
            </span>
            {(settings?.siteName || 'Prahvi Jewelry').split(' ').length > 1 && (
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-gold-600 font-medium">
                {(settings?.siteName || 'Prahvi Jewelry').split(' ').slice(1).join(' ')}
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-gold-600 ${location.pathname === link.path ? 'text-gold-600' : 'text-gray-600'}`}
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-red-600 hover:text-red-700">Admin</Link>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-5">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-600 hover:text-gold-600 transition-colors"
            >
              <LucideIcons.Search size={20} className="sm:w-5 sm:h-5" />
            </button>
            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-gold-600 transition-colors">
              <Heart size={20} className="sm:w-5 sm:h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 bg-gold-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gold-600 transition-colors">
              <ShoppingCart size={20} className="sm:w-5 sm:h-5" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-gold-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>
            <Link to="/profile" className="hidden sm:block p-2 text-gray-600 hover:text-gold-600 transition-colors">
              <UserIcon size={20} />
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-gray-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white flex flex-col"
          >
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between border-b border-gray-100">
              <form onSubmit={handleSearch} className="flex-grow flex items-center">
                <LucideIcons.Search size={24} className="text-gray-400 mr-4" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search for jewelry, collections..."
                  className="w-full text-xl font-serif outline-none placeholder:text-gray-300"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </form>
              <button onClick={() => setIsSearchOpen(false)} className="p-2 text-gray-400 hover:text-gray-900">
                <X size={28} />
              </button>
            </div>
            <div className="flex-grow p-8 max-w-7xl mx-auto w-full">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Popular Searches</h4>
              <div className="flex flex-wrap gap-3">
                {['Necklaces', 'Diamond Rings', 'Gold Bangles', 'Earrings', 'Bridal Sets'].map(term => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term);
                      navigate(`/shop?search=${encodeURIComponent(term)}`);
                      setIsSearchOpen(false);
                    }}
                    className="px-6 py-2 rounded-full border border-gray-100 text-sm hover:bg-gray-50 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-1"
          >
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg sm:hidden"
            >
              My Profile
            </Link>
            {user && (
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg sm:hidden flex items-center space-x-2"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-4 text-base font-bold text-red-600 bg-red-50/50 rounded-lg mt-2"
              >
                Admin Panel
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  const { settings } = useSettings();
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl font-serif font-bold tracking-tighter uppercase">{settings?.siteName || 'Prahvi'}</span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed">
            {settings?.siteDescription}
          </p>
            <div className="flex space-x-4">
              <a href={settings?.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-gold-600 transition-colors"><Instagram size={18} /></a>
              <a href={settings?.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-gold-600 transition-colors"><Facebook size={18} /></a>
              <a href={`mailto:${settings?.email}`} className="p-2 bg-gray-800 rounded-full hover:bg-gold-600 transition-colors"><Mail size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-serif font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {settings?.quickLinks && settings.quickLinks.length > 0 ? (
                settings.quickLinks.map((link, i) => (
                  <li key={i}><Link to={link.path} className="hover:text-white transition-colors">{link.name}</Link></li>
                ))
              ) : (
                <>
                  <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
                  <li><Link to="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
                  <li><Link to="/shop?category=rings" className="hover:text-white transition-colors">Rings</Link></li>
                  <li><Link to="/shop?category=necklaces" className="hover:text-white transition-colors">Necklaces</Link></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-serif font-semibold mb-6">Customer Care</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/policies/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link to="/policies/return" className="hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/policies/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-serif font-semibold mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-gold-600 shrink-0" />
                <span>{settings?.address}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-gold-600 shrink-0" />
                <span>{settings?.phone}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-gold-600 shrink-0" />
                <span>{settings?.email}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Prahvi Jewelry. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// --- Pages ---

const InstagramGallery = ({ settings }: { settings: StoreSettings }) => {
  if (!settings?.instagramGallery || !settings.instagramGallery.images?.length) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-serif font-bold text-gray-900">{settings.instagramGallery.title || "Real People, Real Style"}</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">{settings.instagramGallery.description || "See how our community wears Prahvi Jewelry. Tag us to be featured!"}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {settings.instagramGallery.images.map((item, i) => (
            <motion.a
              key={i}
              href={item.link || "#"}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-square overflow-hidden rounded-3xl bg-gray-100"
            >
              <img
                src={item.url}
                alt={`Gallery ${i}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Instagram className="text-white" size={32} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pQuery = query(collection(db, 'products'), limit(20));
        const pSnapshot = await getDocs(pQuery);
        const pData = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(pData);

        const cSnapshot = await getDocs(collection(db, 'categories'));
        const cData = cSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(cData);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={settings?.hero?.image || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2000"}
            alt="Hero Jewelry"
            className="w-full h-full object-cover scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl space-y-8"
          >
            <div className="space-y-4">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block text-gold-400 font-medium tracking-[0.3em] uppercase text-sm"
              >
                {settings?.hero?.subtitle || "Premium Style. Affordable Luxury."}
              </motion.span>
              <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-[0.9] tracking-tighter">
                {settings?.hero?.title || "Elevate Your Everyday Style"}
              </h1>
              <p className="text-lg text-gray-300 max-w-lg leading-relaxed font-light">
                {settings?.hero?.description || "Modern, trendy jewellery designed to elevate your everyday style."}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="px-8 py-4 bg-gold-600 text-white rounded-full font-semibold hover:bg-gold-500 transition-all flex items-center space-x-2 shadow-xl shadow-gold-600/20"
              >
                <span>Shop Collection</span>
                <ChevronRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12 border-y border-gray-100">
          {(settings?.features || []).map((feature, i) => {
            const IconComponent = (LucideIcons as any)[feature.icon] || Star;
            return (
              <div key={i} className="flex items-center space-x-4">
                <div className="p-3 bg-gold-50 text-gold-600 rounded-2xl">
                  <IconComponent size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories Grid - Compact Circular Look */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
            {settings?.categorySection?.title || "Shop by Category"}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {settings?.categorySection?.description || "Explore our diverse range of jewelry pieces."}
          </p>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 md:gap-8">
          <Link
            to="/shop"
            className="group flex flex-col items-center space-y-3"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gold-400 group-hover:bg-gold-50 transition-all duration-500 overflow-hidden">
              <Sparkles size={24} className="text-gold-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest group-hover:text-gold-600 transition-colors">All</span>
          </Link>
          {categories
            .filter(cat => settings?.categoryVisibility?.[cat.id] !== false)
            .map((cat) => {
            const getIcon = (name: string) => {
              const n = name.toLowerCase();
              if (n.includes('gold')) return <Coins size={24} className="text-gold-600" />;
              if (n.includes('diamond')) return <Diamond size={24} className="text-gold-600" />;
              if (n.includes('earring')) return <Flower size={24} className="text-gold-600" />;
              if (n.includes('ring')) return <Circle size={24} className="text-gold-600" />;
              if (n.includes('daily')) return <Watch size={24} className="text-gold-600" />;
              if (n.includes('gemstone')) return <Hexagon size={24} className="text-gold-600" />;
              if (n.includes('wedding')) return <Heart size={24} className="text-gold-600" />;
              if (n.includes('gift')) return <Gift size={24} className="text-gold-600" />;
              return <MoreHorizontal size={24} className="text-gold-600" />;
            };

            return (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.id}`}
                className="group flex flex-col items-center space-y-3"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gold-400 group-hover:bg-gold-50 transition-all duration-500 overflow-hidden">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                  ) : (
                    getIcon(cat.name)
                  )}
                </div>
                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest group-hover:text-gold-600 transition-colors truncate w-full text-center">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* All Products Section */}
      <section className="bg-gold-50/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">Our Collection</h2>
              <p className="text-gray-500">Explore our full range of exquisite jewelry pieces.</p>
            </div>
            <Link to="/shop" className="hidden md:flex items-center space-x-2 text-gold-600 font-semibold hover:text-gold-700 transition-colors">
              <span>View All Products</span>
              <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {products.length > 0 ? (
              products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="aspect-[4/5] bg-white rounded-2xl animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[350px] sm:h-[450px] md:h-[600px] rounded-[2rem] md:rounded-[3rem] overflow-hidden"
          >
            <img
              src={settings?.about?.image || "https://images.unsplash.com/photo-1573408302185-06ff321cf6e6?auto=format&fit=crop&q=80&w=1000"}
              alt="Our Story"
              className="w-full h-full object-cover md:object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gold-900/10" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">{settings?.about?.title || "Our Story"}</h2>
              <div className="w-20 h-1 bg-gold-600" />
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              {settings?.about?.content || "Prahvi Jewelry was born out of a passion for creating beautiful, high-quality jewelry that everyone can afford."}
            </p>
            <Link to="/shop" className="inline-flex items-center space-x-2 text-gold-600 font-bold hover:text-gold-700 transition-colors group">
              <span>Explore Our Collection</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Instagram Gallery */}
      <InstagramGallery settings={settings} />

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Customer Stories</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Hear from our community of jewelry lovers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(settings?.testimonials || []).map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6 relative"
            >
              <div className="flex text-gold-500">
                {[...Array(5)].map((_, starI) => (
                  <Star key={starI} size={16} fill={starI < t.rating ? 'currentColor' : 'none'} />
                ))}
              </div>
              <p className="text-gray-600 italic leading-relaxed">"{t.content}"</p>
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-50">
                {t.image ? (
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gold-50 flex items-center justify-center text-gold-600 font-bold">
                    {t.name.charAt(0)}
                  </div>
                )}
                <h4 className="font-bold text-gray-900">{t.name}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[3rem] overflow-hidden bg-gray-900 py-20 px-8 md:px-20 text-center space-y-8">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-600 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-600 blur-[120px] rounded-full" />
          </div>
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">{settings?.newsletter?.title || "Join the Prahvi Circle"}</h2>
            <p className="text-gray-400">{settings?.newsletter?.description || "Subscribe to receive exclusive offers, early access to new collections, and jewelry care tips."}</p>
            <form className="flex flex-col sm:flex-row gap-4 mt-8">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-grow bg-white/10 border border-white/20 rounded-full px-8 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
              />
              <button className="px-10 py-4 bg-gold-600 text-white rounded-full font-bold hover:bg-gold-500 transition-all shadow-lg shadow-gold-600/20 whitespace-nowrap">
                Subscribe Now
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Shop Page ---

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  
  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'newest';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cSnapshot = await getDocs(collection(db, 'categories'));
        setCategories(cSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));

        let pQuery = query(collection(db, 'products'));
        if (selectedCategory !== 'all') {
          pQuery = query(collection(db, 'products'), where('category', '==', selectedCategory));
        }
        const pSnapshot = await getDocs(pQuery);
        let pData = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

        // Client-side search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          pData = pData.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          );
        }

        // Sorting
        pData.sort((a, b) => {
          if (sortBy === 'price-low') return a.price - b.price;
          if (sortBy === 'price-high') return b.price - a.price;
          if (sortBy === 'newest') return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
          return 0;
        });

        setProducts(pData);
      } catch (error) {
        console.error("Error fetching shop data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">
            {searchQuery ? `Search: "${searchQuery}"` : 'Our Collection'}
          </h1>
          <p className="text-gray-500">
            {products.length} {products.length === 1 ? 'piece' : 'pieces'} found
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSearchParams({})}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-gold-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </button>
            {categories
              .filter(cat => settings?.categoryVisibility?.[cat.id] !== false)
              .map(cat => (
              <button
                key={cat.id}
                onClick={() => setSearchParams({ category: cat.id, sort: sortBy, search: searchQuery })}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat.id ? 'bg-gold-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={e => setSearchParams({ category: selectedCategory, sort: e.target.value, search: searchQuery })}
            className="bg-gray-50 border border-gray-100 rounded-full px-6 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
            <div key={i} className="aspect-[4/5] bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : products.length > 0 ? (
          products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <p className="text-xl text-gray-400 font-serif">No products found in this category.</p>
            <button onClick={() => setSearchParams({})} className="text-gold-600 font-medium hover:underline">View all products</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Product Detail Page ---

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [completeTheLook, setCompleteTheLook] = useState<Product[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [showSizeConfirm, setShowSizeConfirm] = useState(false);
  const [isBuyNowPending, setIsBuyNowPending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'products', id));
        if (docSnap.exists()) {
          const pData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(pData);

          // Fetch "Complete the Look" if relatedProductIds exist
          if (pData.relatedProductIds && pData.relatedProductIds.length > 0) {
            const lookQuery = query(collection(db, 'products'), where('id', 'in', pData.relatedProductIds));
            const lookSnap = await getDocs(lookQuery);
            setCompleteTheLook(lookSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
          }
        }

        const rQuery = query(collection(db, 'reviews'), where('productId', '==', id), where('approved', '==', true));
        const rSnap = await getDocs(rQuery);
        setReviews(rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));

        // Fetch related products
        const relQuery = query(
          collection(db, 'products'), 
          where('category', '==', docSnap.data().category),
          limit(5)
        );
        const relSnap = await getDocs(relQuery);
        setRelatedProducts(relSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => p.id !== id)
        );
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product || product.images.length <= 1 || !isAutoPlaying || isZoomed) return;
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % product.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [product, isAutoPlaying, isZoomed]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to leave a review.");
      return;
    }
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        customerName: user.displayName,
        rating: newReview.rating,
        comment: newReview.comment,
        approved: false, // Admin needs to approve
        createdAt: serverTimestamp(),
      });
      toast.success("Review submitted! It will appear once approved.");
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      toast.error("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="pt-40 text-center font-serif text-2xl animate-pulse">Loading masterpiece...</div>;
  if (!product) return <div className="pt-40 text-center font-serif text-2xl">Product not found.</div>;

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && product.videoUrl && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVideoOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setIsVideoOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <iframe
                src={product.videoUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-serif font-bold">Ring Size Guide</h2>
                  <button onClick={() => setIsSizeGuideOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-widest">
                      <tr>
                        <th className="px-4 py-3">Indian Size</th>
                        <th className="px-4 py-3">Diameter (mm)</th>
                        <th className="px-4 py-3">Circumference (mm)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { in: "6", d: "14.6", c: "45.9" },
                        { in: "7", d: "15.0", c: "47.1" },
                        { in: "8", d: "15.3", c: "48.0" },
                        { in: "9", d: "15.6", c: "49.0" },
                        { in: "10", d: "15.9", c: "50.0" },
                        { in: "11", d: "16.2", c: "50.9" },
                        { in: "12", d: "16.5", c: "51.8" },
                        { in: "13", d: "16.8", c: "52.8" },
                        { in: "14", d: "17.2", c: "54.0" },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-gold-50/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-900">{row.in}</td>
                          <td className="px-4 py-3 text-gray-600">{row.d}</td>
                          <td className="px-4 py-3 text-gray-600">{row.c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-gold-50 rounded-xl text-xs text-gold-700 leading-relaxed">
                  <strong>How to measure:</strong> Wrap a piece of string or paper around the base of your finger. Mark the point where the ends meet. Measure the string or paper with a ruler (mm). This is the circumference.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Size Confirmation Modal */}
      <AnimatePresence>
        {showSizeConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSizeConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6"
            >
              <div className="w-16 h-16 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mx-auto">
                <LucideIcons.Info size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold">No Size Selected</h3>
                <p className="text-gray-500 text-sm">You haven't selected a size. Would you like to continue with the default size or no specific size?</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    addToCart(product, detailQuantity, '');
                    setShowSizeConfirm(false);
                    if (isBuyNowPending) {
                      navigate('/checkout');
                      setIsBuyNowPending(false);
                    }
                  }}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gold-600 transition-all"
                >
                  Continue Anyway
                </button>
                <button
                  onClick={() => {
                    setShowSizeConfirm(false);
                    setIsBuyNowPending(false);
                  }}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Select a Size
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center space-x-2 text-[10px] sm:text-xs text-gray-400 mb-8 uppercase tracking-widest">
        <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
        <ChevronRight size={10} />
        <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Images */}
        <div className="space-y-4">
          <div 
            className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 cursor-zoom-in group"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => {
              setIsZoomed(true);
              setIsAutoPlaying(false);
            }}
            onMouseLeave={() => {
              setIsZoomed(false);
              setIsAutoPlaying(true);
            }}
          >
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className={`w-full h-full object-contain transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'}`}
              style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
              referrerPolicy="no-referrer"
            />
            {product.videoUrl && (
              <div className="absolute bottom-4 right-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVideoOpen(true);
                  }}
                  className="bg-white/90 backdrop-blur p-3 rounded-full shadow-lg text-gold-600 hover:bg-gold-600 hover:text-white transition-all flex items-center space-x-2 group"
                >
                  <LucideIcons.Play size={20} fill="currentColor" />
                  <span className="text-xs font-bold pr-2 hidden group-hover:block">Watch Video</span>
                </button>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-gray-900' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-serif text-gray-900 lowercase first-letter:uppercase leading-tight">{product.name}</h1>
            <div className="flex items-center space-x-4">
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-gray-400 line-through text-xl">₹{product.originalPrice.toLocaleString()}</span>
              )}
              <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.stock === 0 && (
                <span className="bg-black text-white text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-widest">Sold Out</span>
              )}
            </div>
          </div>

          {product.stock === 0 && (
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span>Out of stock</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="flex items-center border border-gray-300 rounded-md h-14 bg-white">
                <button 
                  onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                  className="px-6 h-full hover:bg-gray-50 transition-colors text-gray-400"
                >
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center font-bold text-lg">{detailQuantity}</span>
                <button 
                  onClick={() => setDetailQuantity(prev => Math.min(product.stock, prev + 1))}
                  className="px-6 h-full hover:bg-gray-50 transition-colors text-gray-400"
                >
                  <Plus size={18} />
                </button>
              </div>
              <button
                onClick={() => {
                  if (product.sizes && product.sizes.length > 0 && !selectedSize) {
                    setIsBuyNowPending(false);
                    setShowSizeConfirm(true);
                    return;
                  }
                  if (product.stock > 0) addToCart(product, detailQuantity, selectedSize);
                }}
                disabled={product.stock === 0}
                className={`flex-grow h-14 rounded-md font-bold uppercase tracking-widest transition-all border ${
                  product.stock > 0 
                  ? 'border-gray-900 text-gray-900 hover:bg-gray-50' 
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {product.stock > 0 ? 'Add to Shopping Bag' : 'Sold Out'}
              </button>
            </div>
            
            {product.stock > 0 && (
              <button 
                onClick={() => {
                  if (product.sizes && product.sizes.length > 0 && !selectedSize) {
                    setIsBuyNowPending(true);
                    setShowSizeConfirm(true);
                    return;
                  }
                  addToCart(product, detailQuantity, selectedSize);
                  navigate('/checkout');
                }}
                className="w-full bg-black text-white h-14 rounded-md font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
              >
                Buy It Now
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.name,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied to clipboard!");
                }
              }}
              className="flex items-center space-x-2 text-gray-500 text-sm hover:text-gray-900 transition-colors font-medium"
            >
              <LucideIcons.Share2 size={16} />
              <span>Share</span>
            </button>
            <button 
              onClick={() => toggleWishlist(product.id)}
              className={`flex items-center space-x-2 text-sm transition-colors font-medium ${isInWishlist(product.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
              <span>{isInWishlist(product.id) ? 'Wishlisted' : 'Add to Wishlist'}</span>
            </button>
          </div>

          <div className="prose prose-gold max-w-none pt-8 border-t border-gray-100">
            <p className="text-gray-600 leading-relaxed text-lg">{product.description}</p>
          </div>

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Size</label>
                <button 
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-[10px] font-bold text-gold-600 hover:underline flex items-center space-x-1"
                >
                  <LucideIcons.Ruler size={12} />
                  <span>Size Guide</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                      selectedSize === size 
                      ? 'border-gold-600 bg-gold-50 text-gold-600' 
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Specifications */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="space-y-4 pt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Specifications</h3>
                {product.category.toLowerCase().includes('ring') && (
                  <button 
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-xs font-bold text-gold-600 hover:underline flex items-center space-x-1"
                  >
                    <LucideIcons.Ruler size={14} />
                    <span>Size Guide</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                    <span className="text-gray-500 font-medium">{key}</span>
                    <span className="text-gray-900 font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete the Look */}
          {completeTheLook.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Complete the Look</h3>
              <div className="grid grid-cols-2 gap-4">
                {completeTheLook.map(item => (
                  <Link key={item.id} to={`/product/${item.id}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl hover:bg-gold-50 transition-colors group">
                    <img src={item.images[0]} className="w-12 h-12 rounded-lg object-contain bg-white" alt="" />
                    <div>
                      <p className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gold-600 font-bold">₹{item.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-32 space-y-12">
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">You May Also Like</h2>
              <p className="text-gray-500">Discover matching pieces and similar styles.</p>
            </div>
            <Link to="/shop" className="text-gold-600 font-bold hover:text-gold-700 transition-colors">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
        <div className="pt-12 space-y-12 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Customer Reviews</h3>
              <div className="flex items-center space-x-2 text-gold-600">
                <Star size={20} fill="currentColor" />
                <span className="font-bold">{reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : '0.0'}</span>
                <span className="text-gray-400 text-sm">({reviews.length})</span>
              </div>
            </div>

            <div className="space-y-8">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-gray-900">{review.customerName}</p>
                      <div className="flex text-gold-500">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />)}
                      </div>
                    </div>
                    <p className="text-gray-600 italic">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No reviews yet. Be the first to share your experience!</p>
              )}
            </div>

            {/* Add Review Form */}
            <div className="bg-gray-50 p-8 rounded-3xl space-y-6">
              <h4 className="text-xl font-serif font-bold">Leave a Review</h4>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={`p-1 transition-colors ${star <= newReview.rating ? 'text-gold-600' : 'text-gray-300'}`}
                      >
                        <Star size={24} fill={star <= newReview.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Your Experience</label>
                  <textarea
                    required
                    value={newReview.comment}
                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all h-32"
                    placeholder="Tell us what you think about this piece..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gold-600 transition-all disabled:bg-gray-300"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    };

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const shippingFee = (total >= (settings.shipping?.freeThreshold || 5000)) ? 0 : (settings.shipping?.flatRate || 0);
  const grandTotal = total + shippingFee;

  const [calcPincode, setCalcPincode] = useState('');
  const [calcRates, setCalcRates] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const totalWeight = cart.reduce((acc, item) => acc + (item.weight || 0.5) * item.quantity, 0);

  const handleCalcShipping = async () => {
    if (!calcPincode) return;
    setIsCalculating(true);
    try {
      const res = await fetch('/api/calculate-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPincode: calcPincode,
          weight: totalWeight
        })
      });
      const data = await res.json();
      setCalcRates(data.rates);
    } catch (err) {
      toast.error("Failed to calculate shipping");
    } finally {
      setIsCalculating(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="pt-40 pb-24 text-center space-y-8">
        <div className="inline-block p-8 bg-gray-50 rounded-full text-gray-300">
          <ShoppingCart size={80} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold">Your bag is empty</h2>
          <p className="text-gray-500">Looks like you haven't added any masterpieces yet.</p>
        </div>
        <Link to="/shop" className="inline-block px-10 py-4 bg-gold-600 text-white rounded-full font-bold hover:bg-gold-500 transition-all">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 sm:pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-4xl font-serif font-bold mb-8 sm:mb-12">Shopping Bag</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-16">
        <div className="lg:col-span-2 space-y-4 sm:space-y-8">
          {cart.map(item => (
            <div key={`${item.productId}-${item.selectedSize || 'no-size'}`} className="flex items-start sm:items-center space-x-4 sm:space-x-6 py-4 sm:py-6 border-b border-gray-100">
              <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-grow space-y-1 min-w-0">
                <h3 className="text-base sm:text-lg font-serif font-bold truncate">{item.name}</h3>
                {item.selectedSize && (
                  <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest">Size: {item.selectedSize}</p>
                )}
                <p className="text-gold-600 font-medium text-sm sm:text-base">₹{item.price.toLocaleString()}</p>
                
                <div className="flex items-center justify-between sm:justify-start sm:space-x-8 pt-2">
                  <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.selectedSize)} className="p-1.5 sm:p-2 hover:bg-gray-50"><Minus size={14} /></button>
                    <span className="w-6 sm:w-8 text-center font-medium text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.selectedSize)} className="p-1.5 sm:p-2 hover:bg-gray-50"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.productId, item.selectedSize)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          <div className="bg-gray-50 p-6 sm:p-8 rounded-3xl space-y-6">
            <h3 className="text-lg sm:text-xl font-serif font-bold">Order Summary</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                {shippingFee === 0 ? (
                  <span className="text-green-600 font-medium">Free</span>
                ) : (
                  <span>₹{shippingFee.toLocaleString()}</span>
                )}
              </div>
              {shippingFee > 0 && settings.shipping?.freeThreshold && (
                <p className="text-[10px] text-gold-600 font-medium italic">
                  Add ₹{(settings.shipping.freeThreshold - total).toLocaleString()} more for FREE shipping!
                </p>
              )}
              <div className="border-t border-gray-200 pt-4 flex justify-between text-base sm:text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gold-600 transition-all shadow-lg"
            >
              Proceed to Checkout
            </button>
          </div>

          {/* Shipping Calculator */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">Estimate Shipping</h4>
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Enter Pincode" 
                value={calcPincode}
                onChange={e => setCalcPincode(e.target.value)}
                className="flex-grow px-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-gold-400 outline-none"
              />
              <button 
                onClick={handleCalcShipping}
                disabled={isCalculating}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                {isCalculating ? '...' : 'Calculate'}
              </button>
            </div>
            {calcRates && (
              <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs text-gray-500">Available Couriers (Total Weight: {totalWeight}kg):</p>
                {Object.values(calcRates).map((rate: any) => (
                  <div key={rate.courierName} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-bold">{rate.courierName}</p>
                      <p className="text-[10px] text-gray-400">Est. {rate.estimatedDays} days</p>
                    </div>
                    <span className="text-sm font-bold text-gold-600">₹{rate.finalCost}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Checkout Page ---

const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'card' | 'upi'>('whatsapp');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [availableRates, setAvailableRates] = useState<any>(null);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

  const totalWeight = cart.reduce((acc, item) => acc + (item.weight || 0.5) * item.quantity, 0);

  useEffect(() => {
    const fetchRates = async () => {
      if (formData.pincode.length === 6) {
        setIsCalculating(true);
        try {
          const res = await fetch('/api/calculate-shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toPincode: formData.pincode,
              weight: totalWeight
            })
          });
          const data = await res.json();
          setAvailableRates(data.rates);
          // Auto-select cheapest courier
          const cheapest = Object.entries(data.rates).sort((a: any, b: any) => a[1].finalCost - b[1].finalCost)[0];
          if (cheapest) setSelectedCourier(cheapest[0]);
        } catch (err) {
          console.error("Failed to fetch rates", err);
        } finally {
          setIsCalculating(false);
        }
      } else {
        setAvailableRates(null);
        setSelectedCourier('');
      }
    };
    fetchRates();
  }, [formData.pincode, totalWeight]);

  const shippingFee = (total >= (settings.shipping?.freeThreshold || 5000)) 
    ? 0 
    : (availableRates && selectedCourier ? availableRates[selectedCourier].finalCost : (settings.shipping?.flatRate || 100));
  
  const grandTotal = total + shippingFee;

  useEffect(() => {
    if (settings.paymentModes) {
      if (settings.paymentModes.whatsapp) {
        setPaymentMethod('whatsapp');
      } else if (settings.paymentModes.upi) {
        setPaymentMethod('upi');
      } else if (settings.paymentModes.card) {
        setPaymentMethod('card');
      }
    }
  }, [settings]);
  const [loading, setLoading] = useState(false);
  const [abandonedId, setAbandonedId] = useState<string | null>(null);

  // Track abandoned cart
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.name && formData.phone && cart.length > 0 && !abandonedId) {
        try {
          const docRef = await addDoc(collection(db, 'orders'), {
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            shippingAddress: {
              addressLine1: formData.addressLine1,
              addressLine2: formData.addressLine2,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
            },
            items: cart,
            subtotal: total,
            shippingFee: shippingFee,
            total: grandTotal,
            status: 'pending',
            paymentMethod: paymentMethod,
            isAbandoned: true,
            createdAt: serverTimestamp(),
          });
          setAbandonedId(docRef.id);
        } catch (error) {
          console.error("Error saving abandoned cart:", error);
        }
      } else if (abandonedId && formData.name && formData.phone) {
        // Update existing abandoned cart
        try {
          await updateDoc(doc(db, 'orders', abandonedId), {
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            shippingAddress: {
              addressLine1: formData.addressLine1,
              addressLine2: formData.addressLine2,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
            },
            total: grandTotal,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error updating abandoned cart:", error);
        }
      }
    }, 2000); // Wait 2 seconds after typing

    return () => clearTimeout(timer);
  }, [formData, cart, abandonedId]);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadToImgBB(file);
      setPaymentScreenshot(url);
      toast.success("Screenshot uploaded!");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'upi' && !paymentScreenshot) {
      toast.error("Please upload payment screenshot for verification");
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        items: cart,
        subtotal: total,
        shippingFee: shippingFee,
        total: grandTotal,
        status: 'pending',
        paymentMethod: paymentMethod,
        paymentScreenshot: paymentScreenshot,
        isAbandoned: false,
        createdAt: serverTimestamp(),
      };
      
      let docRef;
      if (abandonedId) {
        await updateDoc(doc(db, 'orders', abandonedId), orderData);
        docRef = { id: abandonedId };
      } else {
        docRef = await addDoc(collection(db, 'orders'), orderData);
      }
      
      if (paymentMethod === 'whatsapp') {
        const message = `Hello Prahvi Jewelry! I've just placed an order (ID: ${docRef.id}).\n\nItems:\n${cart.map(item => `- ${item.name} (x${item.quantity})`).join('\n')}\n\nTotal: ₹${grandTotal.toLocaleString()}\n\nPlease confirm my order.`;
        const whatsappUrl = `https://wa.me/${(settings?.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } else if (paymentMethod === 'upi') {
        toast.success("Order placed! We will verify your payment screenshot.");
      } else {
        toast.info("Redirecting to secure payment gateway...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success("Payment successful! (Demo Mode)");
      }
      
      clearCart();
      toast.success("Order placed successfully!");
      navigate('/');
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return <div className="pt-40 text-center font-serif text-2xl">Your bag is empty.</div>;

  return (
    <div className="pt-32 pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif font-bold">Checkout</h1>
          <p className="text-gray-500">Please provide your details to complete the order.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-500/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone Number (WhatsApp)</label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Address Line 1</label>
              <input required type="text" value={formData.addressLine1} onChange={e => setFormData({ ...formData, addressLine1: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Address Line 2 (Optional)</label>
              <input type="text" value={formData.addressLine2} onChange={e => setFormData({ ...formData, addressLine2: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">City</label>
              <input required type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">State</label>
              <input required type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pincode</label>
              <input required type="text" maxLength={6} value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-gold-500 transition-all" />
            </div>
          </div>

          {availableRates && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">Select Shipping Method</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(availableRates).map(([id, rate]: [string, any]) => (
                  <div 
                    key={id}
                    onClick={() => setSelectedCourier(id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedCourier === id ? 'border-gold-600 bg-gold-50' : 'border-gray-100 hover:border-gold-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{rate.courierName}</p>
                        <p className="text-xs text-gray-500">Est. {rate.estimatedDays} days</p>
                      </div>
                      <span className="font-bold text-gold-600">₹{rate.finalCost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">Payment Method</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {settings.paymentModes?.whatsapp && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('whatsapp')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'whatsapp' ? 'border-gold-500 bg-gold-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'whatsapp' ? 'bg-gold-200 text-gold-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Phone size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">WhatsApp</p>
                    </div>
                  </div>
                  {paymentMethod === 'whatsapp' && <div className="w-4 h-4 rounded-full bg-gold-500" />}
                </button>
              )}

              {settings.paymentModes?.upi && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'upi' ? 'border-gold-500 bg-gold-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'upi' ? 'bg-gold-200 text-gold-700' : 'bg-gray-100 text-gray-500'}`}>
                      <LucideIcons.QrCode size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">UPI / QR</p>
                    </div>
                  </div>
                  {paymentMethod === 'upi' && <div className="w-4 h-4 rounded-full bg-gold-500" />}
                </button>
              )}

              {settings.paymentModes?.card && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'card' ? 'border-gold-500 bg-gold-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'card' ? 'bg-gold-200 text-gold-700' : 'bg-gray-100 text-gray-500'}`}>
                      <CreditCard size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">Card</p>
                    </div>
                  </div>
                  {paymentMethod === 'card' && <div className="w-4 h-4 rounded-full bg-gold-500" />}
                </button>
              )}
            </div>
          </div>

          {paymentMethod === 'upi' && (
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-6 text-center">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Scan QR Code to Pay</p>
                {settings.upiQrCode ? (
                  <img src={settings.upiQrCode} alt="UPI QR Code" className="w-48 h-48 mx-auto rounded-xl border-4 border-white shadow-sm" />
                ) : (
                  <div className="w-48 h-48 mx-auto bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                    <LucideIcons.QrCode size={48} />
                  </div>
                )}
                {settings.upiId && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">UPI ID</p>
                    <p className="text-lg font-mono font-bold text-gray-900">{settings.upiId}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-4">
                <p className="text-sm font-medium text-gray-700">Upload Payment Screenshot</p>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label
                    htmlFor="screenshot-upload"
                    className={`flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-gold-400 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {paymentScreenshot ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <LucideIcons.CheckCircle size={20} />
                        <span className="text-sm font-medium">Screenshot Uploaded</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={20} className={isUploading ? 'animate-bounce' : ''} />
                        <span className="text-sm font-medium">{isUploading ? 'Uploading...' : 'Choose File'}</span>
                      </>
                    )}
                  </label>
                </div>
                {paymentScreenshot && (
                  <img src={paymentScreenshot} alt="Payment Screenshot" className="w-32 h-32 mx-auto object-cover rounded-lg border border-gray-200" />
                )}
              </div>
              <p className="text-xs text-gray-500">We will verify the screenshot and confirm your order.</p>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 space-y-2">
            <div className="flex justify-between items-center text-gray-600">
              <span>Subtotal</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Shipping Fee</span>
              <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-lg font-bold">Total Amount</span>
              <span className="text-2xl font-bold text-gray-900">₹{grandTotal.toLocaleString()}</span>
            </div>
            <button
              type="submit"
              disabled={loading || isUploading}
              className="w-full mt-6 bg-gold-600 text-white py-5 rounded-2xl font-bold hover:bg-gold-500 transition-all shadow-xl shadow-gold-600/20 disabled:bg-gray-300"
            >
              {loading ? 'Processing...' : (paymentMethod === 'upi' ? 'Confirm & Place Order' : 'Place Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Contact = () => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'contact_messages'), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-12">
          <div className="space-y-4">
            <h1 className="text-5xl font-serif font-bold">Get in Touch</h1>
            <p className="text-gray-500 text-lg">Have a question? We're here to help you find your perfect piece.</p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="p-4 bg-gold-50 text-gold-600 rounded-2xl"><MapPin size={24} /></div>
              <div>
                <h4 className="font-bold text-gray-900">Visit Our Boutique</h4>
                <p className="text-gray-500">{settings.address}</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="p-4 bg-gold-50 text-gold-600 rounded-2xl"><Phone size={24} /></div>
              <div>
                <h4 className="font-bold text-gray-900">Call Us</h4>
                <p className="text-gray-500">{settings.phone}<br />{settings.workingHours}</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="p-4 bg-gold-50 text-gold-600 rounded-2xl"><Mail size={24} /></div>
              <div>
                <h4 className="font-bold text-gray-900">Email Us</h4>
                <p className="text-gray-500">{settings.email}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-500/5 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Your Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
            <input
              required
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
              placeholder="e.g. +91 98765 43210"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <input
              required
              type="text"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Message</label>
            <textarea
              required
              rows={5}
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold hover:bg-gold-600 transition-all shadow-xl disabled:bg-gray-300"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Policies = () => {
  const { type } = useParams();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      const q = query(collection(db, 'policies'), where('type', '==', type));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setPolicy({ id: snap.docs[0].id, ...snap.docs[0].data() } as Policy);
      }
      setLoading(false);
    };
    fetchPolicy();
  }, [type]);

  if (loading) return <div className="pt-40 text-center font-serif text-2xl">Loading policy...</div>;

  return (
    <div className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="space-y-4 text-center">
        <h1 className="text-5xl font-serif font-bold capitalize">{type?.replace('-', ' ')} Policy</h1>
        <p className="text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
      <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-500/5 prose prose-gold max-w-none">
        {policy ? (
          <div dangerouslySetInnerHTML={{ __html: policy.content.replace(/\n/g, '<br/>') }} />
        ) : (
          <p className="text-center text-gray-400 italic">This policy is currently being updated. Please contact us for more information.</p>
        )}
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        const q = query(collection(db, 'orders'), where('customerEmail', '==', user.email), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      };
      fetchOrders();
    }
  }, [user]);

  if (loading) return <div className="pt-40 text-center font-serif text-2xl">Loading profile...</div>;
  if (!user) return (
    <div className="pt-40 text-center space-y-6">
      <h2 className="text-3xl font-serif font-bold">Sign In</h2>
      <p className="text-gray-500">Please sign in to view your order history.</p>
      <button onClick={() => loginWithGoogle()} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gold-600 transition-all">
        Sign In with Google
      </button>
    </div>
  );

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="flex items-center space-x-6">
        <img src={user.photoURL || ''} className="w-20 h-20 rounded-full border-4 border-gold-100" alt="" />
        <div>
          <h1 className="text-3xl font-serif font-bold">{user.displayName}</h1>
          <p className="text-gray-500">{user.email}</p>
          <Link to="/wishlist" className="text-sm text-gold-600 font-medium hover:underline flex items-center mt-2">
            <Heart size={14} className="mr-1" /> View Wishlist
          </Link>
          <button 
            onClick={() => logout()} 
            className="text-sm text-red-600 font-medium hover:underline flex items-center mt-2 group"
          >
            <LogOut size={14} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-serif font-bold">Your Orders</h2>
        {orders.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-mono">#{order.id.slice(-6)}</p>
                  <p className="font-bold text-gray-900">{order.items.length} Items</p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt?.toDate()).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gold-600">${order.total.toLocaleString()}</p>
                  <div className="flex items-center space-x-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gold-100 text-gold-700'}`}>
                      {order.status}
                    </span>
                    {order.trackingNumber && (
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {order.trackingNumber}
                        </span>
                        {order.trackingLink && (
                          <a href={order.trackingLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700" title="Track Order">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    )}
                    <a
                      href={`https://wa.me/${(settings?.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! I have a question about my order #${order.id.slice(-6)}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-all"
                      title="Contact support on WhatsApp"
                    >
                      <Phone size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">You haven't placed any orders yet.</p>
        )}
      </div>
    </div>
  );
};
// --- Admin Dashboard ---

const AdminSettings = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, 'categories'));
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    };
    fetchCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: 'hero' | 'about' | 'upiQrCode') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Uploading image...");
    try {
      const url = await uploadToImgBB(file);
      if (section === 'upiQrCode') {
        setFormData(prev => ({ ...prev, upiQrCode: url }));
      } else {
        setFormData(prev => ({ ...prev, [section]: { ...prev[section], image: url } }));
      }
      toast.success("Image uploaded!", { id: toastId });
    } catch (error) {
      toast.error("Upload failed", { id: toastId });
    }
  };

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
  };

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFormData({ ...formData, features: newFeatures });
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-bold">Store Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-serif font-bold mb-6">General Information</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Site Name</label>
                <input type="text" value={formData.siteName || ''} onChange={e => setFormData({ ...formData, siteName: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Site Tagline</label>
                <input type="text" value={formData.siteDescription || ''} onChange={e => setFormData({ ...formData, siteDescription: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Store Email</label>
                <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input type="text" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Store Address</label>
              <textarea value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={2} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Working Hours</label>
              <input type="text" value={formData.workingHours || ''} onChange={e => setFormData({ ...formData, workingHours: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Instagram URL</label>
                <input type="text" value={formData.instagram || ''} onChange={e => setFormData({ ...formData, instagram: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Facebook URL</label>
                <input type="text" value={formData.facebook || ''} onChange={e => setFormData({ ...formData, facebook: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">WhatsApp Number (with country code)</label>
              <input type="text" value={formData.whatsapp || ''} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h4 className="font-bold">Announcement Bar</h4>
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={formData.announcementBar?.enabled || false}
                  onChange={e => setFormData({ ...formData, announcementBar: { ...formData.announcementBar, enabled: e.target.checked } })}
                  className="w-5 h-5 rounded text-gold-600 focus:ring-gold-500"
                />
                <span className="text-sm font-medium">Enable Announcement Bar</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Announcement Text</label>
                <input type="text" value={formData.announcementBar?.text || ''} onChange={e => setFormData({ ...formData, announcementBar: { ...formData.announcementBar, text: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Announcement Link (Optional)</label>
                <input type="text" value={formData.announcementBar?.link || ''} onChange={e => setFormData({ ...formData, announcementBar: { ...formData.announcementBar, link: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" placeholder="/shop" />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h4 className="font-bold">Shipping Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Free Shipping Threshold (₹)</label>
                  <input type="number" value={formData.shipping?.freeThreshold || 0} onChange={e => setFormData({ ...formData, shipping: { ...formData.shipping, freeThreshold: Number(e.target.value) } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Flat Shipping Rate (₹)</label>
                  <input type="number" value={formData.shipping?.flatRate || 0} onChange={e => setFormData({ ...formData, shipping: { ...formData.shipping, flatRate: Number(e.target.value) } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Pincode Specific Rates (JSON format)</label>
                <textarea
                  rows={3}
                  value={JSON.stringify(formData.shipping?.pincodeRates || {}, null, 2)}
                  onChange={e => {
                    try {
                      const rates = JSON.parse(e.target.value);
                      setFormData({ ...formData, shipping: { ...formData.shipping, pincodeRates: rates } });
                    } catch (err) {}
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none font-mono text-xs"
                  placeholder='{ "110001": 50, "400001": 80 }'
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h4 className="font-bold">Payment Modes</h4>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paymentModes?.whatsapp}
                    onChange={e => setFormData({ ...formData, paymentModes: { ...formData.paymentModes, whatsapp: e.target.checked } })}
                    className="w-5 h-5 rounded text-gold-600 focus:ring-gold-500"
                  />
                  <span className="text-sm font-medium">WhatsApp Checkout</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paymentModes?.card}
                    onChange={e => setFormData({ ...formData, paymentModes: { ...formData.paymentModes, card: e.target.checked } })}
                    className="w-5 h-5 rounded text-gold-600 focus:ring-gold-500"
                  />
                  <span className="text-sm font-medium">Card Payment (Demo)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paymentModes?.upi}
                    onChange={e => setFormData({ ...formData, paymentModes: { ...formData.paymentModes, upi: e.target.checked } })}
                    className="w-5 h-5 rounded text-gold-600 focus:ring-gold-500"
                  />
                  <span className="text-sm font-medium">UPI / QR Payment</span>
                </label>
              </div>
            </div>

            {formData.paymentModes?.upi && (
              <div className="pt-6 border-t border-gray-100 space-y-6">
                <h4 className="font-bold">UPI Configuration</h4>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">UPI ID (e.g., yourname@okaxis)</label>
                  <input type="text" value={formData.upiId || ''} onChange={e => setFormData({ ...formData, upiId: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">UPI QR Code Image URL</label>
                  <div className="flex space-x-4">
                    <input type="text" value={formData.upiQrCode || ''} onChange={e => setFormData({ ...formData, upiQrCode: e.target.value })} className="flex-grow px-4 py-2 rounded-xl border border-gray-200 outline-none" placeholder="Paste image URL here" />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(e, 'upiQrCode')}
                        className="hidden"
                        id="qr-upload"
                      />
                      <label htmlFor="qr-upload" className="px-4 py-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-all flex items-center space-x-2">
                        <Upload size={18} />
                        <span>Upload</span>
                      </label>
                    </div>
                  </div>
                  {formData.upiQrCode && (
                    <img src={formData.upiQrCode} alt="QR Preview" className="w-32 h-32 object-contain rounded-lg border border-gray-200 mt-2" />
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h4 className="font-bold">Category Visibility</h4>
              <p className="text-xs text-gray-500">Control which categories are visible on the website.</p>
              <div className="grid grid-cols-2 gap-4">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                    <input
                      type="checkbox"
                      checked={formData.categoryVisibility?.[cat.id] !== false}
                      onChange={e => {
                        const newVisibility = { ...(formData.categoryVisibility || {}) };
                        newVisibility[cat.id] = e.target.checked;
                        setFormData({ ...formData, categoryVisibility: newVisibility });
                      }}
                      className="w-5 h-5 rounded text-gold-600 focus:ring-gold-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gold-600 transition-all">
              Save Settings
            </button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-xl font-serif font-bold">Hero Section</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hero Title</label>
              <input type="text" value={formData.hero?.title || ''} onChange={e => setFormData({ ...formData, hero: { ...formData.hero, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hero Subtitle</label>
              <input type="text" value={formData.hero?.subtitle || ''} onChange={e => setFormData({ ...formData, hero: { ...formData.hero, subtitle: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hero Description</label>
              <textarea value={formData.hero?.description || ''} onChange={e => setFormData({ ...formData, hero: { ...formData.hero, description: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hero Image</label>
              <div className="flex items-center space-x-4">
                <input type="text" value={formData.hero?.image || ''} onChange={e => setFormData({ ...formData, hero: { ...formData.hero, image: e.target.value } })} className="flex-grow px-4 py-2 rounded-xl border border-gray-200 outline-none" placeholder="Image URL" />
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'hero')} className="hidden" id="hero-upload" />
                <label htmlFor="hero-upload" className="p-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-all">
                  <Upload size={20} />
                </label>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">About Section</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">About Title</label>
              <input type="text" value={formData.about?.title || ''} onChange={e => setFormData({ ...formData, about: { ...formData.about, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">About Content</label>
              <textarea value={formData.about?.content || ''} onChange={e => setFormData({ ...formData, about: { ...formData.about, content: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={5} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">About Image</label>
              <div className="flex items-center space-x-4">
                <input type="text" value={formData.about?.image || ''} onChange={e => setFormData({ ...formData, about: { ...formData.about, image: e.target.value } })} className="flex-grow px-4 py-2 rounded-xl border border-gray-200 outline-none" placeholder="Image URL" />
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'about')} className="hidden" id="about-upload" />
                <label htmlFor="about-upload" className="p-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-all">
                  <Upload size={20} />
                </label>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">Testimonials</h3>
          <p className="text-sm text-gray-500">Manage customer testimonials shown on the homepage.</p>
          <div className="space-y-6">
            {(formData.testimonials || []).map((t, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-4 relative">
                <button
                  onClick={() => {
                    const newT = (formData.testimonials || []).filter((_, idx) => idx !== i);
                    setFormData({ ...formData, testimonials: newT });
                  }}
                  className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <X size={16} />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Customer Name</label>
                    <input
                      type="text"
                      value={t.name || ''}
                      onChange={e => {
                        const newT = [...(formData.testimonials || [])];
                        newT[i].name = e.target.value;
                        setFormData({ ...formData, testimonials: newT });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Rating (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={t.rating || 5}
                      onChange={e => {
                        const newT = [...(formData.testimonials || [])];
                        newT[i].rating = Number(e.target.value);
                        setFormData({ ...formData, testimonials: newT });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Content</label>
                  <textarea
                    value={t.content || ''}
                    onChange={e => {
                      const newT = [...(formData.testimonials || [])];
                      newT[i].content = e.target.value;
                      setFormData({ ...formData, testimonials: newT });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setFormData({ ...formData, testimonials: [...(formData.testimonials || []), { name: '', content: '', rating: 5 }] })}
              className="flex items-center space-x-2 text-gold-600 font-bold hover:text-gold-700"
            >
              <Plus size={18} />
              <span>Add Testimonial</span>
            </button>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">Instagram Gallery</h3>
          <p className="text-sm text-gray-500">Showcase real people wearing your jewelry.</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Gallery Title</label>
              <input type="text" value={formData.instagramGallery?.title || ''} onChange={e => setFormData({ ...formData, instagramGallery: { ...formData.instagramGallery, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Gallery Description</label>
              <input type="text" value={formData.instagramGallery?.description || ''} onChange={e => setFormData({ ...formData, instagramGallery: { ...formData.instagramGallery, description: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-4">
              {(formData.instagramGallery?.images || []).map((img, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-4 relative">
                  <button
                    onClick={() => {
                      const newImgs = (formData.instagramGallery?.images || []).filter((_, idx) => idx !== i);
                      setFormData({ ...formData, instagramGallery: { ...formData.instagramGallery, images: newImgs } });
                    }}
                    className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Image URL</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={img.url || ''}
                          onChange={e => {
                            const newImgs = [...(formData.instagramGallery?.images || [])];
                            newImgs[i].url = e.target.value;
                            setFormData({ ...formData, instagramGallery: { ...formData.instagramGallery, images: newImgs } });
                          }}
                          className="flex-grow px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await uploadToImgBB(file);
                              const newImgs = [...(formData.instagramGallery?.images || [])];
                              newImgs[i].url = url;
                              setFormData({ ...formData, instagramGallery: { ...formData.instagramGallery, images: newImgs } });
                              toast.success("Image uploaded!");
                            } catch (err) {
                              toast.error("Upload failed");
                            }
                          }}
                          className="hidden"
                          id={`gallery-upload-${i}`}
                        />
                        <label htmlFor={`gallery-upload-${i}`} className="p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100 border border-gray-200">
                          <Upload size={16} />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Post Link (Optional)</label>
                      <input
                        type="text"
                        value={img.link || ''}
                        onChange={e => {
                          const newImgs = [...(formData.instagramGallery?.images || [])];
                          newImgs[i].link = e.target.value;
                          setFormData({ ...formData, instagramGallery: { ...formData.instagramGallery, images: newImgs } });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="https://instagram.com/p/..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setFormData({ ...formData, instagramGallery: { ...formData.instagramGallery, images: [...(formData.instagramGallery?.images || []), { url: '', link: '' }] } })}
                className="flex items-center space-x-2 text-gold-600 font-bold hover:text-gold-700"
              >
                <Plus size={18} />
                <span>Add Image to Gallery</span>
              </button>
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">Quick Links</h3>
          <p className="text-sm text-gray-500">Manage the links shown in the footer.</p>
          <div className="space-y-4">
            {(formData.quickLinks || []).map((link, i) => (
              <div key={i} className="flex items-center space-x-4">
                <input
                  type="text"
                  value={link.name}
                  onChange={e => {
                    const newLinks = [...(formData.quickLinks || [])];
                    newLinks[i].name = e.target.value;
                    setFormData({ ...formData, quickLinks: newLinks });
                  }}
                  className="flex-grow px-4 py-2 rounded-xl border border-gray-200 outline-none"
                  placeholder="Link Name"
                />
                <input
                  type="text"
                  value={link.path}
                  onChange={e => {
                    const newLinks = [...(formData.quickLinks || [])];
                    newLinks[i].path = e.target.value;
                    setFormData({ ...formData, quickLinks: newLinks });
                  }}
                  className="flex-grow px-4 py-2 rounded-xl border border-gray-200 outline-none"
                  placeholder="Path (e.g. /shop)"
                />
                <button
                  onClick={() => {
                    const newLinks = (formData.quickLinks || []).filter((_, idx) => idx !== i);
                    setFormData({ ...formData, quickLinks: newLinks });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setFormData({ ...formData, quickLinks: [...(formData.quickLinks || []), { name: '', path: '' }] })}
              className="flex items-center space-x-2 text-gold-600 font-bold hover:text-gold-700"
            >
              <Plus size={18} />
              <span>Add Link</span>
            </button>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">Category Section</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category Section Title</label>
              <input type="text" value={formData.categorySection?.title || ''} onChange={e => setFormData({ ...formData, categorySection: { ...formData.categorySection, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category Section Description</label>
              <textarea value={formData.categorySection?.description || ''} onChange={e => setFormData({ ...formData, categorySection: { ...formData.categorySection, description: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={2} />
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">Newsletter Section</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Newsletter Title</label>
              <input type="text" value={formData.newsletter?.title || ''} onChange={e => setFormData({ ...formData, newsletter: { ...formData.newsletter, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Newsletter Description</label>
              <textarea value={formData.newsletter?.description || ''} onChange={e => setFormData({ ...formData, newsletter: { ...formData.newsletter, description: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={2} />
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">Featured Section</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Featured Section Title</label>
              <input type="text" value={formData.featuredSection?.title || ''} onChange={e => setFormData({ ...formData, featuredSection: { ...formData.featuredSection, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Featured Section Description</label>
              <textarea value={formData.featuredSection?.description || ''} onChange={e => setFormData({ ...formData, featuredSection: { ...formData.featuredSection, description: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={2} />
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">Features Section</h3>
          <p className="text-sm text-gray-500">Edit the features shown on the homepage.</p>
          <div className="space-y-6">
            {(formData.features || []).map((feature, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Icon (Lucide Name)</label>
                    <input
                      type="text"
                      value={feature.icon || ''}
                      onChange={e => updateFeature(i, 'icon', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      placeholder="Star, Truck, Shield, etc."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
                    <input
                      type="text"
                      value={feature.title || ''}
                      onChange={e => updateFeature(i, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                  <input
                    type="text"
                    value={feature.desc || ''}
                    onChange={e => updateFeature(i, 'desc', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gold-600 transition-all">
            Save Features
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const mSnap = await getDocs(collection(db, 'contact_messages'));
      setMessageCount(mSnap.size);
    };
    fetchCounts();
  }, []);

  if (loading) return <div className="pt-40 text-center font-serif text-2xl">Verifying credentials...</div>;
  if (!isAdmin) {
    return (
      <div className="pt-40 text-center space-y-6">
        <h2 className="text-3xl font-serif font-bold">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to access the admin panel.</p>
        <button onClick={() => navigate('/')} className="text-gold-600 font-medium hover:underline">Return to Home</button>
      </div>
    );
  }

  const sidebarLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: ListTree },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Abandoned Bags', path: '/admin/abandoned', icon: Trash2 },
    { name: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
    { name: 'Policies', path: '/admin/policies', icon: Shield },
    { name: 'Messages', path: '/admin/messages', icon: Mail, badge: messageCount > 0 ? messageCount : null },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="pt-20 min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-serif font-bold text-gray-900">Admin Panel</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Prahvi Jewelry</p>
        </div>
        <nav className="flex-grow p-4 space-y-1">
          {sidebarLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${location.pathname === link.path ? 'bg-gold-50 text-gold-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <div className="flex items-center space-x-3">
                <link.icon size={18} />
                <span>{link.name}</span>
              </div>
              {link.badge && (
                <span className="bg-gold-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => logout()} className="flex items-center space-x-3 px-4 py-3 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/products" element={<AdminProducts />} />
          <Route path="/categories" element={<AdminCategories />} />
          <Route path="/orders" element={<AdminOrders />} />
          <Route path="/abandoned" element={<AdminAbandonedCarts />} />
          <Route path="/reviews" element={<AdminReviews />} />
          <Route path="/policies" element={<AdminPolicies />} />
          <Route path="/messages" element={<AdminMessages />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
      </main>
    </div>
  );
};

const AdminHome = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, totalRevenue: 0, pendingOrders: 0, messages: 0 });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const pSnap = await getDocs(collection(db, 'products'));
      const oSnap = await getDocs(collection(db, 'orders'));
      const mSnap = await getDocs(query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'), limit(5)));
      const cSnap = await getDocs(collection(db, 'categories'));
      
      const products = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      const orders = oSnap.docs.map(doc => doc.data() as Order);
      const messages = mSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
      const cats = cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
      
      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
      setStats({
        products: pSnap.size,
        orders: oSnap.size,
        totalRevenue,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        messages: mSnap.size
      });

      setLowStockProducts(products.filter(p => p.stock < 5));
      setRecentMessages(messages);

      // Best Sellers Calculation
      const productSales: { [key: string]: { name: string, count: number, revenue: number, image: string } } = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.name, count: 0, revenue: 0, image: item.image };
          }
          productSales[item.productId].count += item.quantity;
          productSales[item.productId].revenue += item.price * item.quantity;
        });
      });
      setBestSellers(Object.values(productSales).sort((a, b) => b.count - a.count).slice(0, 5));

      // Category Performance
      const catPerf: { [key: string]: number } = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          const categoryId = product?.category;
          const category = categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
          catPerf[category] = (catPerf[category] || 0) + (item.price * item.quantity);
        });
      });
      setCategoryStats(Object.entries(catPerf).map(([name, value]) => ({ name, value })));

      // Simple chart data generation (last 7 days)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      setChartData(days.map(day => ({
        name: day,
        sales: Math.floor(Math.random() * 5000) + 1000
      })));
    };
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Products', value: stats.products, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-gold-600', bg: 'bg-gold-50' },
    { name: 'Pending Orders', value: stats.pendingOrders, icon: RefreshCcw, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4"
          >
            <div className={`p-4 rounded-xl ${card.bg} ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.name}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart & Best Sellers */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-serif font-bold">Weekly Sales Performance</h3>
              <select className="text-sm border-none bg-gray-50 rounded-lg px-3 py-1 focus:ring-0">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-xl font-serif font-bold">Best Sellers</h3>
            <div className="space-y-4">
              {bestSellers.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                  <div className="flex items-center space-x-4">
                    <img src={item.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.count} units sold</p>
                    </div>
                  </div>
                  <p className="font-bold text-gold-600">₹{item.revenue.toLocaleString()}</p>
                </div>
              ))}
              {bestSellers.length === 0 && <p className="text-center text-gray-400 py-8">No sales data yet.</p>}
            </div>
          </div>
        </div>

        {/* Inventory, Messages & Categories */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-xl font-serif font-bold">Category Performance</h3>
            <div className="space-y-4">
              {categoryStats.map((cat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{cat.name}</span>
                    <span className="font-bold text-gray-900">₹{cat.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gold-400 rounded-full" 
                      style={{ width: `${stats.totalRevenue > 0 ? (cat.value / stats.totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {categoryStats.length === 0 && <p className="text-center text-gray-400 py-8">No category data yet.</p>}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 text-orange-600">
              <AlertTriangle size={20} />
              <h3 className="text-xl font-serif font-bold">Inventory Alerts</h3>
            </div>
            <div className="space-y-4">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <div className="flex items-center space-x-3">
                      <img src={product.images[0]} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{product.name}</p>
                        <p className="text-xs text-orange-600 font-medium">{product.stock === 0 ? 'OUT OF STOCK' : `${product.stock} units left`}</p>
                      </div>
                    </div>
                    <Link to="/admin/products" className="p-2 bg-white rounded-lg text-orange-600 hover:bg-orange-100 transition-colors">
                      <Plus size={16} />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex p-4 bg-green-50 text-green-600 rounded-full mb-4">
                    <Shield size={32} />
                  </div>
                  <p className="text-gray-500 text-sm">All inventory levels are healthy.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gold-600">
                <Mail size={20} />
                <h3 className="text-xl font-serif font-bold">Recent Messages</h3>
              </div>
              <Link to="/admin/messages" className="text-xs font-bold text-gold-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {recentMessages.map(msg => (
                <div key={msg.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-gray-900">{msg.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</p>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{msg.message}</p>
                </div>
              ))}
              {recentMessages.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No new messages.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: 0, originalPrice: 0, category: '', images: '', stock: 0, featured: false,
    specs: '', labels: '', videoUrl: '', relatedProductIds: '', sizes: '', weight: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      const pSnap = await getDocs(collection(db, 'products'));
      setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      const cSnap = await getDocs(collection(db, 'categories'));
      setCategories(cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    };
    fetchData();
  }, []);

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadToImgBB(file);
      setFormData(prev => ({
        ...prev,
        images: prev.images ? `${prev.images}, ${url}` : url
      }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Using ImgBB.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      images: (formData.images || '').split(',').map(s => s.trim()).filter(Boolean),
      labels: (formData.labels || '').split(',').map(s => s.trim()).filter(Boolean),
      relatedProductIds: (formData.relatedProductIds || '').split(',').map(s => s.trim()).filter(Boolean),
      sizes: (formData.sizes || '').split(',').map(s => s.trim()).filter(Boolean),
      weight: Number(formData.weight || 0),
      specs: (formData.specs || '').split('\n').reduce((acc: any, line) => {
        const [key, ...val] = line.split(':');
        if (key && val.length > 0) acc[key.trim()] = val.join(':').trim();
        return acc;
      }, {}),
      createdAt: serverTimestamp()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        toast.success("Product updated!");
      } else {
        await addDoc(collection(db, 'products'), data);
        toast.success("Product added!");
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      // Refresh list
      const pSnap = await getDocs(collection(db, 'products'));
      setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Manage Products</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '', description: '', price: 0, originalPrice: 0, category: '', images: '', stock: 0, featured: false, specs: '', labels: '', videoUrl: '', relatedProductIds: '', sizes: '', weight: 0
            });
            setIsModalOpen(true);
          }}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gold-600 transition-all flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Product</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Category</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Price</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Discount</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Stock</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img src={product.images[0]} className="w-10 h-10 rounded-lg object-contain bg-gray-50" alt="" />
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {categories.find(c => c.id === product.category)?.name || product.category || 'Uncategorized'}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gold-600">₹{product.price.toLocaleString()}</p>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <p className="text-xs text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {product.originalPrice && product.originalPrice > product.price ? (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.stock}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setFormData({
                          name: product.name || '',
                          description: product.description || '',
                          price: product.price || 0,
                          originalPrice: product.originalPrice || 0,
                          category: product.category || '',
                          images: (product.images || []).join(', '),
                          stock: product.stock || 0,
                          featured: product.featured || false,
                          videoUrl: product.videoUrl || '',
                          relatedProductIds: (product.relatedProductIds || []).join(', '),
                          sizes: (product.sizes || []).join(', '),
                          weight: product.weight || 0,
                          specs: product.specs ? Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).join('\n') : '',
                          labels: (product.labels || []).join(', ')
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gold-600 transition-colors"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("Delete this product?")) {
                          await deleteDoc(doc(db, 'products', product.id));
                          setProducts(products.filter(p => p.id !== product.id));
                          toast.success("Product deleted");
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Product Name</label>
                    <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea required rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Original Price (₹)</label>
                    <input 
                      type="number" 
                      value={formData.originalPrice || 0} 
                      onChange={e => {
                        const original = Number(e.target.value);
                        setFormData({ ...formData, originalPrice: original });
                      }} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discount (%)</label>
                    <input 
                      type="number" 
                      value={(formData.originalPrice && formData.originalPrice > 0) ? Math.round(((formData.originalPrice - (formData.price || 0)) / formData.originalPrice) * 100) : 0} 
                      onChange={e => {
                        const discount = Number(e.target.value);
                        if (formData.originalPrice && formData.originalPrice > 0) {
                          const newPrice = Math.round(formData.originalPrice * (1 - discount / 100));
                          setFormData({ ...formData, price: newPrice });
                        }
                      }} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selling Price (₹)</label>
                    <input 
                      required 
                      type="number" 
                      value={formData.price || 0} 
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock</label>
                    <input required type="number" value={formData.stock || 0} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (kg)</label>
                    <input required type="number" step="0.01" value={formData.weight || 0} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select required value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center space-x-3 pt-8">
                    <input type="checkbox" checked={formData.featured || false} onChange={e => setFormData({ ...formData, featured: e.target.checked })} className="w-5 h-5 rounded text-gold-600 focus:ring-gold-500" />
                    <label className="text-sm font-medium">Featured Product</label>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Video URL (YouTube/Vimeo Embed Link)</label>
                    <input type="text" value={formData.videoUrl || ''} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="https://www.youtube.com/embed/..." />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Related Product IDs (comma separated)</label>
                    <input type="text" value={formData.relatedProductIds || ''} onChange={e => setFormData({ ...formData, relatedProductIds: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="ID1, ID2, ID3" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Available Sizes (comma separated, e.g. 6, 7, 8 or 2.4, 2.6)</label>
                    <input type="text" value={formData.sizes || ''} onChange={e => setFormData({ ...formData, sizes: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="6, 7, 8, 9" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Product Labels (comma separated, e.g. New, Best Seller)</label>
                    <input type="text" value={formData.labels || ''} onChange={e => setFormData({ ...formData, labels: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="New, Sale, Limited Edition" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Specifications (One per line, format: Key: Value)</label>
                    <textarea rows={4} value={formData.specs || ''} onChange={e => setFormData({ ...formData, specs: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm" placeholder="Material: 18k Gold&#10;Weight: 5.2g&#10;Stone: Diamond" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Product Images</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Upload Image</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className={`flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-gold-400 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Upload size={20} className={isUploading ? 'animate-bounce' : ''} />
                            <span className="text-sm font-medium">{isUploading ? 'Uploading...' : 'Choose File'}</span>
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Or Paste URLs (comma separated)</label>
                        <textarea
                          rows={2}
                          value={formData.images || ''}
                          onChange={e => setFormData({ ...formData, images: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                          placeholder="https://example.com/img1.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gold-600 transition-all">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', image: '' });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, 'categories'));
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    };
    fetchCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadToImgBB(file);
      setFormData(prev => ({ ...prev, image: url }));
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'categories'), formData);
      toast.success("Category added!");
      setIsModalOpen(false);
      setFormData({ name: '', description: '', image: '' });
      const snap = await getDocs(collection(db, 'categories'));
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    } catch (error) {
      toast.error("Failed to add category");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Manage Categories</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gold-600 transition-all flex items-center space-x-2">
          <Plus size={20} />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <img src={cat.image || 'https://picsum.photos/seed/jewelry/400/300'} className="w-full h-32 object-cover rounded-xl" alt="" />
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="text-sm font-bold truncate">{cat.name}</h3>
                <p className="text-[10px] text-gray-500 line-clamp-1">{cat.description}</p>
              </div>
              <button
                onClick={async () => {
                  if (confirm("Delete category?")) {
                    await deleteDoc(doc(db, 'categories', cat.id));
                    setCategories(categories.filter(c => c.id !== cat.id));
                    toast.success("Category deleted");
                  }
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
              <h2 className="text-2xl font-serif font-bold">Add Category</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category Name</label>
                  <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea rows={2} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category Image</label>
                  <div className="flex items-center space-x-4">
                    <input type="text" required value={formData.image || ''} onChange={e => setFormData({ ...formData, image: e.target.value })} className="flex-grow px-4 py-3 rounded-xl border border-gray-200" placeholder="URL or upload ->" />
                    <label className="cursor-pointer p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                      <Upload size={20} className={isUploading ? 'animate-bounce' : ''} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>
                <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gold-600 transition-all">Add Category</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminAbandonedCarts = () => {
  const [carts, setCarts] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarts = async () => {
      const q = query(collection(db, 'orders'), where('isAbandoned', '==', true), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCarts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    };
    fetchCarts();
  }, []);

  const sendReminder = (cart: Order) => {
    const message = `Hello ${cart.customerName}! We noticed you left some beautiful jewelry in your bag at Prahvi Jewelry. Would you like to complete your purchase?\n\nItems: ${cart.items.map(i => i.name).join(', ')}\n\nShop here: ${window.location.origin}/shop`;
    const url = `https://wa.me/${cart.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="pt-20 text-center font-serif text-xl">Loading abandoned bags...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-bold">Abandoned Bags</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Customer</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Items</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Total</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Date</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {carts.map(cart => (
              <tr key={cart.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{cart.customerName}</div>
                  <div className="text-xs text-gray-500">{cart.customerPhone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-gray-600 max-w-xs truncate">
                    {cart.items.map(i => i.name).join(', ')}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gold-600">₹{cart.total.toLocaleString()}</td>
                <td className="px-6 py-4 text-xs text-gray-400">
                  {cart.createdAt ? new Date(cart.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => sendReminder(cart)}
                    className="flex items-center space-x-2 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-4 py-2 rounded-full transition-all"
                  >
                    <Phone size={14} />
                    <span>Send Reminder</span>
                  </button>
                </td>
              </tr>
            ))}
            {carts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-gray-400">No abandoned bags found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      let trackingData: { trackingNumber?: string; trackingLink?: string } = {};
      if (newStatus === 'shipped') {
        const trackingNumber = window.prompt("Enter Tracking Number:");
        if (trackingNumber) {
          const trackingLink = window.prompt("Enter Tracking Link (Optional):", `https://www.delhivery.com/track/package/${trackingNumber}`);
          trackingData = { trackingNumber, trackingLink: trackingLink || '' };
        }
      }
      
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus, ...trackingData });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, ...trackingData } : o));
      toast.success("Status updated!");
      
      if (newStatus === 'shipped') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const message = `Hello ${order.customerName}! Your order #${order.id.slice(-6)} has been SHIPPED.${trackingData.trackingNumber ? `\n\nTracking Number: ${trackingData.trackingNumber}${trackingData.trackingLink ? `\nTrack here: ${trackingData.trackingLink}` : ''}` : ''}\n\nThank you for shopping with us!`;
          const url = `https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
        }
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const sendWhatsAppUpdate = (order: Order) => {
    let message = `Hello ${order.customerName}! This is Prahvi Jewelry. Your order (ID: ${order.id}) status has been updated to: ${order.status.toUpperCase()}.\n\nThank you for shopping with us!`;
    if (order.status === 'shipped' && order.trackingNumber) {
      message = `Hello ${order.customerName}! Your order #${order.id.slice(-6)} status is SHIPPED.\n\nTracking Number: ${order.trackingNumber}${order.trackingLink ? `\nTrack here: ${order.trackingLink}` : ''}\n\nThank you!`;
    }
    const url = `https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Email', 'Total', 'Status', 'Payment Method', 'Address'];
    const rows = orders.map(o => [
      o.id,
      o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
      o.customerName,
      o.customerPhone,
      o.customerEmail,
      o.total,
      o.status,
      o.paymentMethod,
      `"${o.shippingAddress.addressLine1}, ${o.shippingAddress.addressLine2 || ''}, ${o.shippingAddress.city}, ${o.shippingAddress.state} - ${o.shippingAddress.pincode}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Manage Orders</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-6 py-3 bg-gold-600 text-white rounded-xl font-bold hover:bg-gold-500 transition-all shadow-lg shadow-gold-600/20"
        >
          <LucideIcons.Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Order ID</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Customer</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Total</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Status</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-gray-500">#{order.id.slice(-6)}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                  <div className="text-xs text-gray-500">{order.customerPhone}</div>
                  {order.trackingNumber && (
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono">
                        {order.trackingNumber}
                      </span>
                      {order.trackingLink && (
                        <a href={order.trackingLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gold-600">₹{order.total.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                    className={`text-xs font-bold px-3 py-1 rounded-full border-none focus:ring-0 ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gold-100 text-gold-700'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => sendWhatsAppUpdate(order)}
                      className="flex items-center space-x-2 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1 rounded-full transition-all"
                    >
                      <Phone size={14} />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={async () => {
                        const num = window.prompt("Edit Tracking Number:", order.trackingNumber || "");
                        if (num !== null) {
                          const link = window.prompt("Edit Tracking Link:", order.trackingLink || `https://www.delhivery.com/track/package/${num}`);
                          await updateDoc(doc(db, 'orders', order.id), { trackingNumber: num, trackingLink: link || "" });
                          setOrders(orders.map(o => o.id === order.id ? { ...o, trackingNumber: num, trackingLink: link || "" } : o));
                          toast.success("Tracking updated!");
                        }
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                      title="Edit Tracking Info"
                    >
                      <Truck size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const snap = await getDocs(collection(db, 'reviews'));
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    };
    fetchReviews();
  }, []);

  const toggleApproval = async (review: Review) => {
    await updateDoc(doc(db, 'reviews', review.id), { approved: !review.approved });
    setReviews(reviews.map(r => r.id === review.id ? { ...r, approved: !r.approved } : r));
    toast.success(review.approved ? "Review hidden" : "Review approved");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-bold">Manage Reviews</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map(review => (
          <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-bold">{review.customerName}</h4>
                <div className="flex text-gold-500">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />)}
                </div>
              </div>
              <button
                onClick={() => toggleApproval(review)}
                className={`text-xs font-bold px-3 py-1 rounded-full ${review.approved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {review.approved ? 'Approved' : 'Pending'}
              </button>
            </div>
            <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  if (confirm("Delete review?")) {
                    await deleteDoc(doc(db, 'reviews', review.id));
                    setReviews(reviews.filter(r => r.id !== review.id));
                    toast.success("Review deleted");
                  }
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const AdminPolicies = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({ type: '', content: '' });

  useEffect(() => {
    const fetchPolicies = async () => {
      const snap = await getDocs(collection(db, 'policies'));
      setPolicies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Policy)));
    };
    fetchPolicies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        await updateDoc(doc(db, 'policies', editingPolicy.id), formData);
        setPolicies(policies.map(p => p.id === editingPolicy.id ? { ...p, ...formData } : p));
        toast.success("Policy updated");
      } else {
        const docRef = await addDoc(collection(db, 'policies'), formData);
        setPolicies([...policies, { id: docRef.id, ...formData } as Policy]);
        toast.success("Policy created");
      }
      setEditingPolicy(null);
      setFormData({ type: '', content: '' });
    } catch (error) {
      toast.error("Failed to save policy");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-bold">Manage Policies</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-xl font-serif font-bold">{editingPolicy ? 'Edit Policy' : 'Add New Policy'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Policy Type</label>
              <select
                value={formData.type || ''}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
                required
              >
                <option value="">Select Type</option>
                <option value="shipping">Shipping</option>
                <option value="return">Return</option>
                <option value="privacy">Privacy</option>
                <option value="terms">Terms</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={formData.content || ''}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none h-64"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-grow bg-gray-900 text-white py-2 rounded-xl font-bold hover:bg-gold-600 transition-all">
                {editingPolicy ? 'Update' : 'Create'}
              </button>
              {editingPolicy && (
                <button type="button" onClick={() => { setEditingPolicy(null); setFormData({ type: '', content: '' }); }} className="px-4 py-2 border border-gray-200 rounded-xl">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="lg:col-span-2 space-y-4">
          {policies.map(policy => (
            <div key={policy.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                <h4 className="font-bold capitalize text-lg">{policy.type.replace('-', ' ')} Policy</h4>
                <p className="text-sm text-gray-500 truncate max-w-md">{policy.content.slice(0, 100)}...</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => { setEditingPolicy(policy); setFormData({ type: policy.type, content: policy.content }); }} className="p-2 text-gray-400 hover:text-gold-600">
                  <Settings size={18} />
                </button>
                <button onClick={async () => { if(window.confirm("Delete policy?")) { await deleteDoc(doc(db, 'policies', policy.id)); setPolicies(policies.filter(p => p.id !== policy.id)); toast.success("Policy deleted"); } }} className="p-2 text-gray-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const snap = await getDocs(query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc')));
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage)));
    };
    fetchMessages();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-bold">Contact Messages</h1>
      <div className="grid grid-cols-1 gap-6">
        {messages.map(msg => (
          <div key={msg.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-bold text-lg">{msg.name}</h4>
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gold-600">{msg.email}</p>
                  <span className="text-gray-300">|</span>
                  <p className="text-sm text-gold-600 flex items-center space-x-1">
                    <LucideIcons.Phone size={14} />
                    <span>{msg.phone}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400">{new Date(msg.createdAt?.toDate()).toLocaleString()}</p>
              </div>
              <button onClick={async () => { if(window.confirm("Delete message?")) { await deleteDoc(doc(db, 'contact_messages', msg.id)); setMessages(messages.filter(m => m.id !== msg.id)); toast.success("Message deleted"); } }} className="text-gray-400 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-gray-500 py-20">No messages received yet.</p>}
      </div>
    </div>
  );
};

const Wishlist = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'products'), where('__name__', 'in', wishlist));
        const snap = await getDocs(q);
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      } catch (error) {
        console.error("Error fetching wishlist products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist]);

  if (loading) return <div className="pt-40 text-center font-serif text-2xl">Loading your wishlist...</div>;

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif font-bold tracking-tight">Your Wishlist</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Save your favorite pieces for later. Log in to sync your wishlist across devices.</p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <div key={product.id} className="space-y-4">
                <ProductCard product={product} />
                <button
                  onClick={() => {
                    addToCart(product, 1);
                    toggleWishlist(product.id);
                  }}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gold-600 transition-all flex items-center justify-center space-x-2"
                >
                  <ShoppingBag size={16} />
                  <span>Move to Bag</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-6">
            <div className="inline-flex p-6 bg-gray-50 rounded-full text-gray-300">
              <Heart size={48} />
            </div>
            <p className="text-xl text-gray-500">Your wishlist is empty.</p>
            <Link to="/shop" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gold-600 transition-all">
              Explore Collection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const About = () => {
  const { settings } = useSettings();
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <img
              src={settings?.about?.image || "https://images.unsplash.com/photo-1573408302185-06ff321cf6e6?auto=format&fit=crop&q=80&w=1000"}
              alt="Our Story"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gold-900/10" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <span className="text-gold-600 font-bold tracking-[0.3em] uppercase text-xs">Since 2024</span>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-gray-900 leading-tight">
                {settings?.about?.title || "Our Story"}
              </h1>
              <div className="w-24 h-1.5 bg-gold-600" />
            </div>
            <div className="prose prose-lg text-gray-600 leading-relaxed font-light">
              <p className="whitespace-pre-wrap">
                {settings?.about?.content || "Prahvi Jewelry was born out of a passion for creating beautiful, high-quality jewelry that everyone can afford. We believe that luxury should be accessible, not exclusive. Our pieces are carefully crafted to bring a touch of elegance to your everyday life."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-100">
              <div>
                <h4 className="text-3xl font-serif font-bold text-gray-900">100%</h4>
                <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Authentic</p>
              </div>
              <div>
                <h4 className="text-3xl font-serif font-bold text-gray-900">5000+</h4>
                <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Happy Clients</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <WishlistProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen bg-white flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/policies/:type" element={<Policies />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </main>
              <Footer />
              <WhatsAppButton />
              <Toaster position="bottom-right" />
            </div>
          </Router>
        </CartProvider>
      </WishlistProvider>
    </SettingsProvider>
  );
}
