import { motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';

export function PremiumPlusButton({
  onClick,
  children,
  isFloating = false,
  isLoading = false,
  type = 'button',
  disabled = false,
}: {
  onClick?: () => void;
  children?: React.ReactNode;
  isFloating?: boolean;
  isLoading?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const baseClass = isFloating
    ? 'md:hidden fixed bottom-[calc(60px+16px+env(safe-area-inset-bottom,20px))] right-4 w-14 h-14 rounded-2xl z-40 shadow-float'
    : 'hidden md:flex px-5 h-[44px] rounded-2xl shadow-sm';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      type={type}
      disabled={disabled || isLoading}
      className={`bg-brand-primary text-black font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none ${baseClass}`}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={isFloating ? 24 : 18} />
      ) : (
        <Plus size={isFloating ? 28 : 18} strokeWidth={2.5} />
      )}
      {children && <span className="text-[15px]">{children}</span>}
    </motion.button>
  );
}
