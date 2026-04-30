import { Link } from 'react-router-dom';
import { motion, type Easing, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, Zap, RotateCcw, Shield, Star, ChevronDown } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
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

// ==========================================
// NEW UI FEATURES
// ==========================================

const MARQUEE_ITEMS = [
  'Free shipping on orders over ₹999', '◆', 'Premium modular design', '◆',
  'Easy 30-day returns', '◆', 'Sustainably crafted', '◆', 'New drops every Friday', '◆',
];

const Marquee = ({ inverted = false }: { inverted?: boolean }) => {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className={`overflow-hidden py-3 ${inverted ? 'bg-background border-y border-border/30' : 'bg-foreground'}`}>
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
      >
        {items.map((item, i) => (
          <span key={i} className={`inline-block text-[10px] uppercase tracking-[0.2em] font-medium shrink-0 ${inverted ? 'text-foreground/50' : 'text-background/70'}`}>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

const Counter = ({ to, suffix = '' }: { to: number; suffix?: string }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    let frame: number;
    const start = performance.now();
    const dur = 1600;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

const Reveal = ({ children, delay = 0, className = '', y = 28 }: { children: React.ReactNode; delay?: number; className?: string; y?: number; }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.4, 0, 0.2, 1] }}>
      {children}
    </motion.div>
  );
};

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

  const perks = [
    { Icon: Zap, title: 'Fast delivery', desc: '2–4 day shipping across India' },
    { Icon: RotateCcw, title: 'Easy returns', desc: 'Hassle-free 30-day return window' },
    { Icon: Shield, title: 'Secure payments', desc: 'UPI, cards & wallets accepted' },
    { Icon: Star, title: 'Premium quality', desc: 'Crafted to last seasons, not trends' },
  ];

  const [email, setEmail] = useState('');
  const [subbed, setSubbed] = useState(false);
  const handleSub = useCallback(() => {
    if (email.includes('@')) setSubbed(true);
  }, [email]);

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

      {/* ── TRUST MARQUEE ── */}
      <Marquee />

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

      {/* ── STATS ── */}
      <section className="border-y border-border/30 py-12 md:py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: 50000, s: '+', l: 'Happy customers' },
              { n: 120, s: '+', l: 'Modular pieces' },
              { n: 98, s: '%', l: 'Satisfaction' },
              { n: 4, s: ' yrs', l: 'Of innovation' },
            ].map((stat, i) => (
              <Reveal key={stat.l} delay={i * 0.08} className="text-center">
                <p className="text-3xl md:text-4xl font-light tracking-tight mb-1.5">
                  <Counter to={stat.n} suffix={stat.s} />
                </p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{stat.l}</p>
              </Reveal>
            ))}
          </div>
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

      {/* ── EDITORIAL BANNER ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '420px' }}>
        <div className="grid md:grid-cols-2 min-h-[420px]">
          {/* Image side */}
          <div className="relative h-72 md:h-auto overflow-hidden">
            <motion.img
              src={'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80&auto=format&fit=crop'}
              alt="SWITCH philosophy"
              className="w-full h-full object-cover"
              initial={{ scale: 1.06 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Text side */}
          <div className="bg-foreground text-background flex items-center px-8 md:px-14 py-14 md:py-20">
            <Reveal y={24}>
              <p className="text-background/45 text-[10px] uppercase tracking-[0.3em] mb-4">Our Philosophy</p>
              <h2 className="text-3xl md:text-4xl font-light tracking-wide leading-snug mb-5">
                One wardrobe,<br />infinite expressions.
              </h2>
              <p className="text-background/55 text-sm font-light leading-relaxed mb-8 max-w-xs">
                Every SWITCH piece is engineered to connect, layer and transform — so your wardrobe grows with your lifestyle, not against it.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 border border-background/30 text-background px-7 py-3 text-[11px] uppercase tracking-[0.18em]
                           hover:bg-background hover:text-foreground transition-all duration-300 group"
              >
                Our Story
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PERKS ── */}
      <section className="py-16 md:py-24 bg-muted/20 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            {perks.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.08} className="text-center">
                <div className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center mx-auto mb-4">
                  <Icon size={16} strokeWidth={1.5} className="text-foreground/70" />
                </div>
                <p className="text-[11px] uppercase tracking-[0.18em] font-medium mb-1.5">{title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Marquee inverted />

      {/* ── NEWSLETTER ── */}
      <section className="py-20 md:py-28 bg-foreground text-background">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center">
          <Reveal y={20}>
            <p className="text-background/45 text-[10px] uppercase tracking-[0.3em] mb-3">Join the community</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-4">Stay in the loop</h2>
            <p className="text-background/50 text-sm font-light leading-relaxed mb-10 max-w-sm mx-auto">
              Early drops, exclusive offers, and style guides — directly in your inbox. No clutter, ever.
            </p>

            <AnimatePresence mode="wait">
              {!subbed ? (
                <motion.div
                  key="form"
                  className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSub()}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent border-b border-background/25 text-background placeholder:text-background/30
                               px-1 py-3 text-sm focus:outline-none focus:border-background/70 transition-colors"
                  />
                  <motion.button
                    onClick={handleSub}
                    className="bg-background text-foreground text-[11px] uppercase tracking-[0.18em] font-medium px-7 py-3 whitespace-nowrap
                               hover:opacity-85 transition-opacity"
                    whileTap={{ scale: 0.97 }}
                  >
                    Subscribe
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm text-background/75 tracking-wide"
                >
                  ✓ &nbsp;You're in — welcome to SWITCH.
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-background/25 text-[10px] tracking-widest uppercase mt-5">
              No spam · Unsubscribe anytime
            </p>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
