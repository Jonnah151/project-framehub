import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function MotionSection({ children }: { children: ReactNode }) {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full"
    >
      {children}
    </motion.section>
  );
}

export function MotionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-soft ${className}`}
    >
      {children}
    </motion.div>
  );
}
