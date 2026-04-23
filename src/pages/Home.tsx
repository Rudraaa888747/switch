import { Link } from 'react-router-dom';
import { motion, type Easing, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { products } from '@/data/products';
import heroBanner from '@/assets/hero-banner.webp';
import categoryOuterwear from '@/assets/category-outerwear.webp';
import categoryBottoms from '@/assets/category-bottoms.webp';
import categoryAccessories from '@/assets/category-accessories.webp';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animations/PageTransition';
import { LetterByLetter } from '@/components/animations/TypewriterText';

// Premium easing curve
const premiumEase: Easing = [0.4, 0, 0.2, 1];

const Home = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  
  // Parallax effect for hero image
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  // Get products without modifying them - just selecting first 8
  const displayProducts = products.slice(0, 8);

  const categories = [
    {
      title: 'Modular Outerwear',
      image: categoryOuterwear,
      link: '/shop?subcategory=jackets',
    },
    {
      title: 'Versatile Bottoms',
      image: categoryBottoms,
      link: '/shop?subcategory=pants',
    },
    {
      title: 'Adaptable Accessories',
      image: categoryAccessories,
      link: '/shop?subcategory=accessories',
    },
  ];

  return (
    <Layout>
      {/* Hero Section with Parallax */}
      <section 
        ref={heroRef}
        className="relative h-[80vh] md:h-[90vh] flex items-center justify-center overflow-hidden"
      >
        {/* Hero Image with Parallax and Premium Zoom Animation */}
        <motion.div 
          className="absolute inset-0"
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
        >
          <motion.img
            src={heroBanner}
            alt="SWITCH Collection"
            className="w-full h-full object-cover object-center"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: premiumEase }}
          />
          {/* Dark overlay with animated reveal */}
          <motion.div 
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </motion.div>
        
        <div className="relative z-10 text-center px-4">
          {/* Text backdrop for enhanced readability */}
          <motion.div 
            className="bg-black/30 backdrop-blur-sm px-8 py-10 md:px-16 md:py-14 rounded-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: premiumEase }}
          >
            {/* Animated headline with letter-by-letter effect */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-3xl md:text-5xl lg:text-6xl font-light tracking-[0.15em] md:tracking-[0.2em] text-white mb-6 drop-shadow-lg"
            >
              <LetterByLetter 
                text="ADAPT. TRANSFORM. EXPRESS." 
                delay={0.8}
                className="text-white"
              />
            </motion.h1>
            
            {/* CTA with bounce effect */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 1.8, 
                ease: premiumEase,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
            >
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 uppercase tracking-widest text-xs font-medium 
                         transition-all duration-300 hover:bg-black hover:text-white hover:scale-[1.02] active:scale-[0.98]
                         btn-shine group"
              >
                Shop Collection
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.6 }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="w-1 h-2 bg-white/70 rounded-full mt-2"
              animate={{ opacity: [1, 0.3, 1], y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Strip - Three Categories with staggered slide-in */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-custom">
          <StaggerContainer className="grid md:grid-cols-3 gap-8 md:gap-12" staggerDelay={0.15}>
            {categories.map((category, index) => (
              <StaggerItem key={category.title}>
                <Link to={category.link} className="group block category-card">
                  <motion.div 
                    className="text-center mb-6"
                    initial={{ opacity: 0, x: index === 0 ? -30 : index === 2 ? 30 : 0 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.6, ease: premiumEase }}
                  >
                    <h3 className="text-xs uppercase tracking-[0.2em] font-medium">
                      {category.title}
                    </h3>
                  </motion.div>
                  <motion.div 
                    className="aspect-square overflow-hidden bg-muted relative"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4, ease: premiumEase }}
                  >
                    <motion.img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.6, ease: premiumEase }}
                    />
                    {/* 3D depth shadow on hover */}
                    <motion.div
                      className="absolute inset-0 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Product Grid with staggered fade-up */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-custom">
          <ScrollReveal className="text-center mb-12">
            <motion.h2 
              className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground mb-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Featured
            </motion.h2>
            <motion.p 
              className="text-2xl md:text-3xl font-light tracking-wide"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              New Arrivals
            </motion.p>
          </ScrollReveal>

          <div className="grid-product">
            {displayProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          <ScrollReveal delay={0.4} className="text-center mt-12">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 btn-outline btn-shine group"
            >
              View All Products
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Newsletter Section with slide-up animation */}
      <ScrollReveal>
        <section className="py-16 md:py-24 bg-foreground text-background">
          <div className="container-custom text-center">
            <motion.h2 
              className="text-2xl md:text-3xl font-light tracking-wide mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: premiumEase }}
            >
              Stay Connected
            </motion.h2>
            <motion.p 
              className="text-background/70 mb-8 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Subscribe for exclusive releases and style updates
            </motion.p>
            <motion.form 
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-transparent border border-background/30 text-background placeholder:text-background/50 
                         focus:outline-none focus:border-background transition-all duration-300"
                whileFocus={{ scale: 1.02, borderColor: 'white' }}
              />
              <motion.button 
                type="submit"
                className="px-8 py-3 bg-background text-foreground uppercase tracking-widest text-xs font-medium
                         transition-all duration-300 hover:bg-background/90"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Subscribe
              </motion.button>
            </motion.form>
          </div>
        </section>
      </ScrollReveal>
    </Layout>
  );
};

export default Home;
