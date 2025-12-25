import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';

export const FloatingCart = () => {
  const navigate = useNavigate();
  const { getTotalItems, getTotalPrice } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-50"
    >
      <motion.button
        onClick={() => navigate('/user/cart')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl h-12 md:h-14 px-4 md:px-5 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
      >
        {/* Cart Icon with Badge */}
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          <AnimatePresence>
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm"
              >
                {totalItems > 9 ? '9+' : totalItems}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/30" />

        {/* Price Info */}
        <div className="text-left">
          <div className="text-[10px] md:text-xs text-white/80">
            {totalItems > 0 ? `${totalItems} item` : 'Keranjang'}
          </div>
          <div className="font-bold text-xs md:text-sm">
            Rp {totalPrice.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Shimmer Effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut"
            }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          />
        </div>
      </motion.button>
    </motion.div>
  );
};
