import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useCart, useWishlist } from '../contexts/StoreContext';
import { toast } from 'sonner';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
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
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
            <button
              onClick={handleAddToCart}
              className="w-full bg-white/90 backdrop-blur-md text-gray-900 py-3 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 hover:bg-gold-600 hover:text-white transition-all shadow-lg"
            >
              <ShoppingCart size={18} />
              <span>Add to Cart</span>
            </button>
          </div>

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

        <div className="p-5 space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-serif font-semibold text-gray-900 line-clamp-1 group-hover:text-gold-600 transition-colors">
              {product.name}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gold-700 font-medium text-lg">
              ${product.price.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              {product.category}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
