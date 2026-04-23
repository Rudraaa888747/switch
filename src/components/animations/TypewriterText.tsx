import { motion, type Easing } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

const premiumEase: Easing = [0.4, 0, 0.2, 1];

export const TypewriterText = ({ 
  text, 
  className = '', 
  delay = 0,
  duration = 0.08,
}: TypewriterTextProps) => {
  const words = text.split(' ');

  return (
    <motion.span
      className={`inline-flex flex-wrap justify-center gap-x-2 ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { 
            staggerChildren: duration, 
            delayChildren: delay,
          },
        },
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block"
          variants={{
            visible: {
              opacity: 1,
              y: 0,
            },
            hidden: {
              opacity: 0,
              y: 20,
            },
          }}
          transition={{
            type: 'spring',
            damping: 12,
            stiffness: 100,
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Letter by letter animation
export const LetterByLetter = ({ 
  text, 
  className = '', 
  delay = 0,
}: TypewriterTextProps) => {
  const letters = text.split('');

  return (
    <motion.span
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { 
            staggerChildren: 0.03, 
            delayChildren: delay,
          },
        },
      }}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="inline-block"
          style={{ whiteSpace: letter === ' ' ? 'pre' : 'normal' }}
          variants={{
            visible: {
              opacity: 1,
              y: 0,
            },
            hidden: {
              opacity: 0,
              y: 10,
            },
          }}
          transition={{
            type: 'spring',
            damping: 12,
            stiffness: 200,
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.span>
  );
};
