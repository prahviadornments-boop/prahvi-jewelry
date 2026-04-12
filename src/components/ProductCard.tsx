import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Eye, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { useCart, useWishlist } from '../contexts/StoreContext';
import { toast } from 'sonner';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = React.useState(1);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && product.images && product.images.length > 1) {
      interval = setInterval(() => {
        setActiveImageIndex((prev) => (prev + 1) % product.images.length);
      }, 1500); // Change image every 1.5 seconds on hover
    } else {
      setActiveImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, product.images]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, quantity);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const incrementQty = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity < product.stock) setQuantity(prev => prev + 1);
  };

  const decrementQty = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gold-200 transition-all duration-500 hover:shadow-xl hover:shadow-gold-500/5"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              src={product.images?.[activeImageIndex] || 'https://picsum.photos/seed/jewelry/800/1000'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
              {product.images.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-1 rounded-full transition-all ${i === activeImageIndex ? 'bg-gold-600 w-3' : 'bg-gray-300'}`} 
                />
              ))}
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          <div className="absolute top-4 right-4 flex flex-col space-y-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 sm:translate-x-4 sm:group-hover:translate-x-0">
            <button 
              onClick={handleWishlist}
              className={`p-2 bg-white/90 backdrop-blur-md rounded-full transition-all shadow-sm ${isInWishlist(product.id) ? 'text-red-500 bg-white' : 'text-gray-600 hover:text-red-500 hover:bg-white'}`}
            >
              <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
            </button>
          </div>
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.labels?.map((label, i) => (
              <span key={i} className="bg-gold-600 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
                {label}
              </span>
            ))}
            {product.stock <= 5 && product.stock > 0 && (
              <div className="bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
                Only {product.stock} Left
              </div>
            )}
          </div>
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <h3 className="text-xs sm:text-sm font-serif font-semibold text-gray-900 line-clamp-1 group-hover:text-gold-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-gold-700 font-bold text-sm sm:text-base">
                ₹{product.price.toLocaleString()}
              </p>
              {product.originalPrice && product.originalPrice > product.price && (
                <p className="text-[10px] text-gray-400 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </p>
              )}
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Add to Cart Controls - Always visible for better UX */}
          <div className="space-y-2 pt-2 border-t border-gray-50">
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden h-8 sm:h-10">
              <button 
                onClick={decrementQty}
                className="px-2 sm:px-4 h-full hover:bg-gray-200 transition-colors text-gray-500"
              >
                <Minus size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
              <span className="flex-grow text-center font-bold text-xs sm:text-sm text-gray-900">{quantity}</span>
              <button 
                onClick={incrementQty}
                className="px-2 sm:px-4 h-full hover:bg-gray-200 transition-colors text-gray-500"
              >
                <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-gray-900 text-white py-2 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center space-x-1 sm:space-x-2 hover:bg-gold-600 transition-all shadow-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
              <span>{product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
