import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Eye, Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useCart, useWishlist } from '../contexts/StoreContext';
import { toast } from 'sonner';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = React.useState(1);

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
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gold-200 transition-all duration-500 hover:shadow-xl hover:shadow-gold-500/5"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
          <img
            src={product.images?.[0] || 'https://picsum.photos/seed/jewelry/800/1000'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-4 group-hover:translate-x-0">
            <button 
              onClick={handleWishlist}
              className={`p-2 bg-white/90 backdrop-blur-md rounded-full transition-all shadow-sm ${isInWishlist(product.id) ? 'text-red-500 bg-white' : 'text-gray-600 hover:text-red-500 hover:bg-white'}`}
            >
              <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
            </button>
            <button className="p-2 bg-white/90 backdrop-blur-md rounded-full text-gray-600 hover:text-gold-600 hover:bg-white transition-all shadow-sm">
              <Eye size={18} />
            </button>
          </div>
          
          {product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Only {product.stock} Left
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <h3 className="text-sm font-serif font-semibold text-gray-900 line-clamp-1 group-hover:text-gold-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-gold-700 font-bold text-base">
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
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden h-10">
              <button 
                onClick={decrementQty}
                className="px-4 h-full hover:bg-gray-200 transition-colors text-gray-500"
              >
                <Minus size={14} />
              </button>
              <span className="flex-grow text-center font-bold text-sm text-gray-900">{quantity}</span>
              <button 
                onClick={incrementQty}
                className="px-4 h-full hover:bg-gray-200 transition-colors text-gray-500"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 hover:bg-gold-600 transition-all shadow-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={16} />
              <span>{product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
