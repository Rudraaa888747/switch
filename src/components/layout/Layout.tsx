import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import { ScrollProgress } from '@/components/animations/ScrollProgress';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const Layout = ({ children, showFooter = true }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Scroll progress indicator */}
      <ScrollProgress />

      <Header />

      <motion.main
        className="flex-1 pt-16 md:pt-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.main>

      {showFooter && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <Footer />
        </motion.div>
      )}
    </div>
  );
};

export default Layout;