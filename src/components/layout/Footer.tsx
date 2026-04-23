import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animations/PageTransition';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    setEmail('');
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container-custom py-12">
        <StaggerContainer 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
          staggerDelay={0.1}
        >
          {/* Brand & Social */}
          <StaggerItem className="space-y-4">
            <motion.h3 
              className="text-lg font-semibold tracking-wider"
              whileHover={{ letterSpacing: '0.15em' }}
              transition={{ duration: 0.3 }}
            >
              SWITCH
            </motion.h3>
            <p className="text-xs text-background/70 leading-relaxed">
              Transforming fashion through AI-powered styling and curated collections.
            </p>
            <motion.a 
              href="#" 
              className="flex items-center gap-2 text-xs uppercase tracking-widest hover:opacity-60 transition-opacity"
              aria-label="Twitter"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Twitter size={14} />
              <span>Follow Us</span>
            </motion.a>
          </StaggerItem>

          {/* Contact Info */}
          <StaggerItem className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest">Contact Us</h3>
            <div className="space-y-3">
              <motion.a 
                href="mailto:hello@switch.com" 
                className="flex items-center gap-3 text-xs text-background/70 hover:text-background transition-colors"
                whileHover={{ x: 5 }}
              >
                <Mail size={14} />
                <span>hello@switch.com</span>
              </motion.a>
              <motion.a 
                href="tel:+919876543210" 
                className="flex items-center gap-3 text-xs text-background/70 hover:text-background transition-colors"
                whileHover={{ x: 5 }}
              >
                <Phone size={14} />
                <span>+91 9876543210</span>
              </motion.a>
              <motion.div 
                className="flex items-start gap-3 text-xs text-background/70"
                whileHover={{ x: 5 }}
              >
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>123 SG Highway, Ahmedabad</span>
              </motion.div>
            </div>
          </StaggerItem>

          {/* Newsletter */}
          <StaggerItem className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest">Newsletter</h3>
            <p className="text-xs text-background/70">
              Subscribe for exclusive offers and style updates.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Your email address"
                className="bg-transparent border border-background/30 px-4 py-2 text-xs tracking-wider placeholder:text-background/50 focus:outline-none focus:border-background flex-1 transition-all duration-300"
                animate={{ 
                  paddingLeft: isFocused ? '1.25rem' : '1rem',
                  borderColor: isFocused ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.3)'
                }}
              />
              <motion.button
                type="submit"
                className="bg-background text-foreground px-4 py-2 text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Join
              </motion.button>
            </form>
          </StaggerItem>
        </StaggerContainer>

        {/* Bottom Bar */}
        <motion.div 
          className="border-t border-background/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-xs text-background/50">
            © 2024 SWITCH. All rights reserved.
          </p>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link 
              to="/about" 
              className="text-xs uppercase tracking-widest hover:opacity-60 transition-opacity"
            >
              About
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
