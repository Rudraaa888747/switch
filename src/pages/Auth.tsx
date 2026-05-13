import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, type Easing } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Premium easing curve
const premiumEase: Easing = [0.4, 0, 0.2, 1];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: premiumEase,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 1,
      ease: premiumEase,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: premiumEase },
  },
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && !name)) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    const result = isLogin
      ? await login(email, password)
      : await signup(name, email, password);

    if (result.success) {
      if (!isLogin) {
        toast({
          title: 'Account created!',
          description: 'Account created successfully. Now please log in.',
        });
        setIsLogin(true);
        return;
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

      navigate('/', { replace: true });
    } else {
      toast({
        title: isLogin ? 'Login Failed' : 'Signup Failed',
        description: result.error || (isLogin
          ? 'Wrong email or password. Please check your credentials and try again.'
          : 'Could not create account. Email may already be in use.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black selection:bg-white/20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* CINEMATIC BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        {/* Deep Black Base */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Noise Texture */}
        <div className="noise-texture scale-[2] opacity-[0.05]" />
        
        {/* Luxury Grid */}
        <div className="absolute inset-0 luxury-grid opacity-20" />

        {/* Ambient Light Blobs */}
        <motion.div 
          className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]"
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Central Spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_60%)]" />
      </div>

      {/* AUTH CARD */}
      <motion.div
        className="relative z-10 w-full max-w-[480px] px-6 py-12 md:py-20"
        variants={cardVariants}
      >
        <div className="luxury-glass p-8 md:p-12 rounded-[2.5rem] relative group">
          {/* Subtle Internal Reflection */}
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.03)_0%,transparent_40%,rgba(255,255,255,0.01)_100%)] pointer-events-none" />
          
          {/* Header */}
          <div className="relative z-10 text-center mb-10">
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6"
              variants={itemVariants}
            >
              <Sparkles size={12} className="text-white/60" />
              <span className="text-[10px] font-bold text-white/80 tracking-[0.2em] uppercase">
                {isLogin ? 'Switch Luxury' : 'Join the Elite'}
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4"
              variants={itemVariants}
            >
              {isLogin ? 'Sign In' : 'Register'}
            </motion.h1>

            <motion.p
              className="text-white/40 text-sm font-light tracking-wide leading-relaxed"
              variants={itemVariants}
            >
              {isLogin
                ? 'Access your curated collection of premium essentials.'
                : 'Become part of the SWITCH aesthetic ecosystem.'}
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.5, ease: premiumEase }}
                  className="overflow-hidden"
                >
                  <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-2.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="luxury-input pl-12"
                      placeholder="Enter your name"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants}>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-2.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="luxury-input pl-12"
                  placeholder="name@example.com"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-2.5 ml-1">
                <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-widest">Password</label>
                {isLogin && (
                  <Link
                    to="/forgot-password"
                    className="text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="luxury-input pl-12 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="luxury-button mt-8"
              variants={itemVariants}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-xs font-bold">
                    {isLogin ? 'Enter Storefront' : 'Create Account'}
                  </span>
                  <ChevronRight size={16} className="opacity-50" />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch Form Toggle */}
          <motion.div 
            className="relative z-10 text-center mt-10"
            variants={itemVariants}
          >
            <p className="text-white/30 text-xs font-light tracking-wide">
              {isLogin ? "New to the experience?" : "Already a member?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-white hover:text-white/80 font-medium transition-colors ml-1"
              >
                {isLogin ? 'Request Access' : 'Sign In'}
              </button>
            </p>
          </motion.div>

          {/* Admin Section */}
          <motion.div
            className="relative z-10 mt-12 pt-8 border-t border-white/5 flex flex-col items-center"
            variants={itemVariants}
          >
            <Link to="/admin/login" className="group/admin">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300">
                <Lock size={12} className="text-white/20 group-hover/admin:text-white/40 transition-colors" />
                <span className="text-[10px] text-white/20 group-hover/admin:text-white/40 uppercase tracking-[0.2em] font-medium">Administrative Access</span>
              </div>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Auth;
