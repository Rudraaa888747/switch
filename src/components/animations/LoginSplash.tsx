import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginSplashProps {
  onComplete: () => void;
  show: boolean;
}

export const LoginSplash = ({ onComplete, show }: LoginSplashProps) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const letters = 'SWITCH'.split('');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }}
        >
          <div className="flex items-center" style={{ letterSpacing: '0.35em' }}>
            {letters.map((letter, i) => (
              <motion.span
                key={i}
                className="text-4xl md:text-5xl lg:text-6xl font-light text-foreground uppercase select-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.4 + i * 0.12,
                  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
