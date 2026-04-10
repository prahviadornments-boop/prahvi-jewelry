import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, storage, loginWithGoogle, logout } from './firebase';
import { doc, getDoc, collection, query, where, limit, getDocs, addDoc, serverTimestamp, updateDoc, deleteDoc, orderBy, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Toaster, toast } from 'sonner';
import * as LucideIcons from 'lucide-react';
import { ShoppingCart, User as UserIcon, Menu, X, Phone, Instagram, Facebook, Mail, MapPin, ChevronRight, Star, Trash2, Plus, Minus, Heart, Shield, Truck, RefreshCcw, LayoutDashboard, Package, ListTree, ShoppingBag, MessageSquare, Settings, LogOut, ExternalLink, Upload, AlertTriangle, TrendingUp, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, Category, Order, Review, Policy, ContactMessage, OrderItem, StoreSettings, Feature } from './types';
import { ProductCard } from './components/ProductCard';
import { CartProvider, WishlistProvider, SettingsProvider, useCart, useWishlist, useSettings, useAuth } from './contexts/StoreContext';

// --- Components ---

// --- Components ---

const Navbar = () => {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-serif font-bold tracking-tighter text-gray-900 uppercase">
              {(settings.siteName || 'Prahvi').split(' ')[0]}
            </span>
            {(settings.siteName || 'Prahvi Jewelry').split(' ').length > 1 && (
              <span className="text-xs uppercase tracking-widest text-gold-600 font-medium">
                {(settings.siteName || 'Prahvi Jewelry').split(' ').slice(1).join(' ')}
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

          <div className="flex items-center space-x-5">
            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-gold-600 transition-colors">
              <Heart size={22} />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 bg-gold-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gold-600 transition-colors">
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-gold-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>
            <Link to="/profile" className="p-2 text-gray-600 hover:text-gold-600 transition-colors">
              <UserIcon size={22} />
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-gray-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

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
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-4 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg"
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
            <span className="text-3xl font-serif font-bold tracking-tighter uppercase">{settings.siteName}</span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed">
            {settings.siteDescription}
          </p>
            <div className="flex space-x-4">
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-gold-600 transition-colors"><Instagram size={18} /></a>
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-gold-600 transition-colors"><Facebook size={18} /></a>
              <a href={`mailto:${settings.email}`} className="p-2 bg-gray-800 rounded-full hover:bg-gold-600 transition-colors"><Mail size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-serif font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
              <li><Link to="/shop?category=rings" className="hover:text-white transition-colors">Rings</Link></li>
              <li><Link to="/shop?category=necklaces" className="hover:text-white transition-colors">Necklaces</Link></li>
              <li><Link to="/shop?category=earrings" className="hover:text-white transition-colors">Earrings</Link></li>
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
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-gold-600 shrink-0" />
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-gold-600 shrink-0" />
                <span>{settings.email}</span>
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

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pQuery = query(collection(db, 'products'), where('featured', '==', true), limit(4));
        const pSnapshot = await getDocs(pQuery);
        const pData = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setFeaturedProducts(pData);

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
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={settings.hero?.image || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2000"}
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
                {settings.hero?.subtitle || "Premium Style. Affordable Luxury."}
              </motion.span>
              <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-[0.9] tracking-tighter">
                {settings.hero?.title || "Elevate Your Everyday Style"}
              </h1>
              <p className="text-lg text-gray-300 max-w-lg leading-relaxed font-light">
                {settings.hero?.description || "Modern, trendy jewellery designed to elevate your everyday style."}
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
          {(settings.features || []).map((feature, i) => {
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

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">{settings.categorySection?.title || "Shop by Category"}</h2>
          <p className="text-gray-500 max-w-xl mx-auto">{settings.categorySection?.description || "Explore our diverse range of jewelry pieces."}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.length > 0 ? (
            categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-white">{cat.name}</h3>
                  <Link to={`/shop?category=${cat.id}`} className="text-gold-400 text-sm font-medium flex items-center space-x-1 group-hover:text-white transition-colors">
                    <span>Explore Collection</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </motion.div>
            ))
          ) : (
            // Placeholder categories if none in DB
            ['Rings', 'Necklaces', 'Earrings'].map((name, i) => (
              <div key={i} className="h-80 bg-gray-100 rounded-3xl animate-pulse" />
            ))
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gold-50/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">{settings.featuredSection?.title || "Featured Pieces"}</h2>
              <p className="text-gray-500">{settings.featuredSection?.description || "Our most coveted designs, handpicked for their exceptional craftsmanship."}</p>
            </div>
            <Link to="/shop" className="hidden md:flex items-center space-x-2 text-gold-600 font-semibold hover:text-gold-700 transition-colors">
              <span>View All Products</span>
              <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              [1, 2, 3, 4].map(i => (
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
            className="relative h-[600px] rounded-[3rem] overflow-hidden"
          >
            <img
              src={settings.about?.image || "https://images.unsplash.com/photo-1573408302185-06ff321cf6e6?auto=format&fit=crop&q=80&w=1000"}
              alt="Our Story"
              className="w-full h-full object-cover"
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
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">{settings.about?.title || "Our Story"}</h2>
              <div className="w-20 h-1 bg-gold-600" />
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              {settings.about?.content || "Prahvi Jewelry was born out of a passion for creating beautiful, high-quality jewelry that everyone can afford."}
            </p>
            <Link to="/shop" className="inline-flex items-center space-x-2 text-gold-600 font-bold hover:text-gold-700 transition-colors group">
              <span>Explore Our Collection</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
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
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">{settings.newsletter?.title || "Join the Prahvi Circle"}</h2>
            <p className="text-gray-400">{settings.newsletter?.description || "Subscribe to receive exclusive offers, early access to new collections, and jewelry care tips."}</p>
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
  
  const selectedCategory = searchParams.get('category') || 'all';

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
        setProducts(pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      } catch (error) {
        console.error("Error fetching shop data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory]);

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">Our Collection</h1>
          <p className="text-gray-500">Discover the perfect piece for every occasion.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSearchParams({})}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-gold-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All Pieces
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ category: cat.id })}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.id ? 'bg-gold-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'products', id));
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        }

        const rQuery = query(collection(db, 'reviews'), where('productId', '==', id), where('approved', '==', true));
        const rSnap = await getDocs(rQuery);
        setReviews(rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gray-50 border border-gray-100">
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? 'border-gold-600' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-gold-600 font-medium uppercase tracking-widest text-sm">{product.category}</p>
            <h1 className="text-5xl font-serif font-bold text-gray-900">{product.name}</h1>
            <p className="text-3xl text-gold-700 font-medium">${product.price.toLocaleString()}</p>
          </div>

          <div className="prose prose-gold max-w-none">
            <p className="text-gray-600 leading-relaxed text-lg">{product.description}</p>
          </div>

          <div className="space-y-6 pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  addToCart(product);
                }}
                disabled={product.stock === 0}
                className="flex-grow bg-gray-900 text-white py-5 rounded-2xl font-bold hover:bg-gold-600 transition-all shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {product.stock > 0 ? 'Add to Shopping Bag' : 'Out of Stock'}
              </button>
              <button 
                onClick={() => toggleWishlist(product.id)}
                className={`p-5 border rounded-2xl transition-all ${isInWishlist(product.id) ? 'border-red-100 text-red-500 bg-red-50' : 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100'}`}
              >
                <Heart size={24} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center space-x-3">
                <Truck size={20} className="text-gold-600" />
                <span className="text-sm font-medium text-gray-700">Free Express Delivery</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center space-x-3">
                <Shield size={20} className="text-gold-600" />
                <span className="text-sm font-medium text-gray-700">Lifetime Warranty</span>
              </div>
            </div>
          </div>

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
      </div>
    </div>
  );
};

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const navigate = useNavigate();

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
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-serif font-bold mb-12">Shopping Bag</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-8">
          {cart.map(item => (
            <div key={item.productId} className="flex items-center space-x-6 py-6 border-b border-gray-100">
              <div className="w-24 h-32 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-grow space-y-1">
                <h3 className="text-lg font-serif font-bold">{item.name}</h3>
                <p className="text-gold-600 font-medium">${item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-2 hover:bg-gray-50"><Minus size={16} /></button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-2 hover:bg-gray-50"><Plus size={16} /></button>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          <div className="bg-gray-50 p-8 rounded-3xl space-y-6">
            <h3 className="text-xl font-serif font-bold">Order Summary</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gold-600 transition-all shadow-lg"
            >
              Proceed to Checkout
            </button>
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
    address: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'card'>('whatsapp');

  useEffect(() => {
    if (settings.paymentModes) {
      if (!settings.paymentModes.whatsapp && settings.paymentModes.card) {
        setPaymentMethod('card');
      } else if (settings.paymentModes.whatsapp) {
        setPaymentMethod('whatsapp');
      }
    }
  }, [settings]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderData = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        address: formData.address,
        items: cart,
        total: total,
        status: 'pending',
        paymentMethod: paymentMethod,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      if (paymentMethod === 'whatsapp') {
        const message = `Hello Prahvi Jewelry! I've just placed an order (ID: ${docRef.id}).\n\nItems:\n${cart.map(item => `- ${item.name} (x${item.quantity})`).join('\n')}\n\nTotal: $${total.toLocaleString()}\n\nPlease confirm my order.`;
        const whatsappUrl = `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } else {
        // Simulate Stripe Checkout
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
              <label className="text-sm font-medium text-gray-700">Shipping Address</label>
              <textarea
                required
                rows={3}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">Payment Method</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <p className="text-xs text-gray-500">Confirm & Pay</p>
                    </div>
                  </div>
                  {paymentMethod === 'whatsapp' && <div className="w-4 h-4 rounded-full bg-gold-500" />}
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
                      <p className="text-sm font-bold">Card Payment</p>
                      <p className="text-xs text-gray-500">Secure Checkout</p>
                    </div>
                  </div>
                  {paymentMethod === 'card' && <div className="w-4 h-4 rounded-full bg-gold-500" />}
                </button>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-2xl font-bold text-gray-900">${total.toLocaleString()}</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-600 text-white py-5 rounded-2xl font-bold hover:bg-gold-500 transition-all shadow-xl shadow-gold-600/20 disabled:bg-gray-300"
            >
              {loading ? 'Processing...' : paymentMethod === 'whatsapp' ? 'Place Order & Confirm on WhatsApp' : 'Pay Now & Place Order'}
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
                    <a
                      href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! I have a question about my order #${order.id.slice(-6)}`)}`}
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
                <input type="text" value={formData.siteName} onChange={e => setFormData({ ...formData, siteName: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Site Tagline</label>
                <input type="text" value={formData.siteDescription} onChange={e => setFormData({ ...formData, siteDescription: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Store Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Store Address</label>
              <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={2} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Working Hours</label>
              <input type="text" value={formData.workingHours} onChange={e => setFormData({ ...formData, workingHours: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Instagram URL</label>
                <input type="text" value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Facebook URL</label>
                <input type="text" value={formData.facebook} onChange={e => setFormData({ ...formData, facebook: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">WhatsApp Number (with country code)</label>
              <input type="text" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
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
              <input type="text" value={formData.hero?.title} onChange={e => setFormData({ ...formData, hero: { ...formData.hero, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hero Subtitle</label>
              <input type="text" value={formData.hero?.subtitle} onChange={e => setFormData({ ...formData, hero: { ...formData.hero, subtitle: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hero Description</label>
              <textarea value={formData.hero?.description} onChange={e => setFormData({ ...formData, hero: { ...formData.hero, description: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hero Image URL</label>
              <input type="text" value={formData.hero?.image} onChange={e => setFormData({ ...formData, hero: { ...formData.hero, image: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">About Section</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">About Title</label>
              <input type="text" value={formData.about?.title} onChange={e => setFormData({ ...formData, about: { ...formData.about, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">About Content</label>
              <textarea value={formData.about?.content} onChange={e => setFormData({ ...formData, about: { ...formData.about, content: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={5} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">About Image URL</label>
              <input type="text" value={formData.about?.image} onChange={e => setFormData({ ...formData, about: { ...formData.about, image: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">Category Section</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category Section Title</label>
              <input type="text" value={formData.categorySection?.title} onChange={e => setFormData({ ...formData, categorySection: { ...formData.categorySection, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category Section Description</label>
              <textarea value={formData.categorySection?.description} onChange={e => setFormData({ ...formData, categorySection: { ...formData.categorySection, description: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={2} />
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">Newsletter Section</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Newsletter Title</label>
              <input type="text" value={formData.newsletter?.title} onChange={e => setFormData({ ...formData, newsletter: { ...formData.newsletter, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Newsletter Description</label>
              <textarea value={formData.newsletter?.description} onChange={e => setFormData({ ...formData, newsletter: { ...formData.newsletter, description: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={2} />
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold pt-6 border-t border-gray-100">Featured Section</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Featured Section Title</label>
              <input type="text" value={formData.featuredSection?.title} onChange={e => setFormData({ ...formData, featuredSection: { ...formData.featuredSection, title: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Featured Section Description</label>
              <textarea value={formData.featuredSection?.description} onChange={e => setFormData({ ...formData, featuredSection: { ...formData.featuredSection, description: e.target.value } })} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" rows={2} />
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
                      value={feature.icon}
                      onChange={e => updateFeature(i, 'icon', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      placeholder="Star, Truck, Shield, etc."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
                    <input
                      type="text"
                      value={feature.title}
                      onChange={e => updateFeature(i, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                  <input
                    type="text"
                    value={feature.desc}
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
    { name: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
    { name: 'Policies', path: '/admin/policies', icon: Shield },
    { name: 'Messages', path: '/admin/messages', icon: Mail },
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
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${location.pathname === link.path ? 'bg-gold-50 text-gold-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <link.icon size={18} />
              <span>{link.name}</span>
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
  const [stats, setStats] = useState({ products: 0, orders: 0, totalRevenue: 0, pendingOrders: 0 });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const pSnap = await getDocs(collection(db, 'products'));
      const oSnap = await getDocs(collection(db, 'orders'));
      const products = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      const orders = oSnap.docs.map(doc => doc.data() as Order);
      
      setStats({
        products: pSnap.size,
        orders: oSnap.size,
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        pendingOrders: orders.filter(o => o.status === 'pending').length
      });

      setLowStockProducts(products.filter(p => p.stock < 5));

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
    { name: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-gold-600', bg: 'bg-gold-50' },
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
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
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
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Alerts */}
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
                      <p className="text-xs text-orange-600 font-medium">{product.stock} units left</p>
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
      </div>
    </div>
  );
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

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: 0, category: '', images: '', stock: 0, featured: false
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
      images: formData.images.split(',').map(s => s.trim()),
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
            setFormData({ name: '', description: '', price: 0, category: '', images: '', stock: 0, featured: false });
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
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Stock</th>
              <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img src={product.images[0]} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                <td className="px-6 py-4 text-sm font-medium text-gold-600">${product.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.stock}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setFormData({ ...product, images: product.images.join(', ') });
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
                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price ($)</label>
                    <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock</label>
                    <input required type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center space-x-3 pt-8">
                    <input type="checkbox" checked={formData.featured} onChange={e => setFormData({ ...formData, featured: e.target.checked })} className="w-5 h-5 rounded text-gold-600 focus:ring-gold-500" />
                    <label className="text-sm font-medium">Featured Product</label>
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
                          value={formData.images}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <img src={cat.image} className="w-full h-40 object-cover rounded-xl" alt="" />
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">{cat.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{cat.description}</p>
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
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category Image</label>
                  <div className="flex items-center space-x-4">
                    <input type="text" required value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="flex-grow px-4 py-3 rounded-xl border border-gray-200" placeholder="URL or upload ->" />
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
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success("Status updated!");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const sendWhatsAppUpdate = (order: Order) => {
    const message = `Hello ${order.customerName}! This is Prahvi Jewelry. Your order (ID: ${order.id}) status has been updated to: ${order.status.toUpperCase()}.\n\nThank you for shopping with us!`;
    const url = `https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-bold">Manage Orders</h1>
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
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gold-600">${order.total.toLocaleString()}</td>
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
                  <button
                    onClick={() => sendWhatsAppUpdate(order)}
                    className="flex items-center space-x-2 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1 rounded-full transition-all"
                  >
                    <Phone size={14} />
                    <span>WhatsApp Update</span>
                  </button>
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
                value={formData.type}
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
                value={formData.content}
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
  const { wishlist } = useWishlist();
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
              <ProductCard key={product.id} product={product} />
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

export default function App() {
  return (
    <SettingsProvider>
      <WishlistProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-white flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/policies/:type" element={<Policies />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
                </Routes>
              </main>
              <Footer />
              <Toaster position="bottom-right" />
            </div>
          </Router>
        </CartProvider>
      </WishlistProvider>
    </SettingsProvider>
  );
}
