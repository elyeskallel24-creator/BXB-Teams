import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export function BottomSheet({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <motion.div initial={{y: '100%'}} animate={{y: 0}} exit={{y: '100%'}} transition={{type: 'spring', damping: 25, stiffness: 200}} className="fixed bottom-0 left-0 right-0 bg-surface-cardLight dark:bg-surface-cardDark rounded-t-3xl z-[101] px-4 py-4 pb-8 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{title}</h2>
              <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition"><X size={20} /></button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
