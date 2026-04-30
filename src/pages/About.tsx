import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

const About = () => {
  return (
    <Layout>
      <div className="bg-background pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Header Section */}
        <section className="container-custom mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4"
          >
            Our Story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-light tracking-wide mb-8"
          >
            One Wardrobe.<br />Infinite Expressions.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            SWITCH was born out of a desire to redefine how we interact with our clothing. We believe that fashion should adapt to your lifestyle, not the other way around. By engineering modular, high-quality pieces, we empower you to seamlessly transition through your day—and your life.
          </motion.p>
        </section>

        {/* Vision & Mission Image */}
        <section className="w-full h-[60vh] md:h-[70vh] mb-20">
          <motion.img
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80&auto=format&fit=crop"
            alt="SWITCH Philosophy"
            className="w-full h-full object-cover"
          />
        </section>

        {/* The Pillars */}
        <section className="container-custom mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                title: 'Modularity',
                desc: 'Every piece is designed to connect, layer, and transform. Snap-on hoods, detachable sleeves, and adaptable fits mean you get more functionality out of fewer garments.'
              },
              {
                title: 'Sustainability',
                desc: 'By creating clothes that serve multiple purposes, we inherently reduce waste. We use ethically sourced, durable materials built to last seasons, not just trends.'
              },
              {
                title: 'Premium Quality',
                desc: 'We partner with the finest manufacturers to ensure every stitch, zipper, and seam meets the highest standards. Luxury is in the details.'
              }
            ].map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center mb-6 text-xl font-light">
                  {i + 1}
                </div>
                <h3 className="text-sm uppercase tracking-[0.2em] font-medium mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-foreground text-background py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="container-custom mx-auto px-4"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-6">Experience the Switch</h2>
            <p className="text-background/70 mb-8 max-w-md mx-auto">
              Ready to transform your wardrobe? Explore our latest collection of modular essentials.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-3 uppercase tracking-widest text-xs font-medium hover:bg-background/90 transition-all duration-300 group"
            >
              Shop Collection
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </section>
      </div>
    </Layout>
  );
};

export default About;
