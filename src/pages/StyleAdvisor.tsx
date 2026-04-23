import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, type Easing } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  X, 
  Sparkles, 
  User,
  Palette,
  Ruler,
  Shirt,
  Check,
  Loader2
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { products } from '@/data/products';
import { useStyleAnalysis, AnalysisResult } from '@/hooks/useStyleAnalysis';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animations/PageTransition';
import { Progress } from '@/components/ui/progress';

// Premium easing curve
const premiumEase: Easing = [0.4, 0, 0.2, 1];

const StyleAdvisor = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { analyzeImage, isAnalyzing } = useStyleAnalysis();
  const { user } = useAuth();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    
    // Animate progress bar
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 300);
    
    const result = await analyzeImage(image);
    
    clearInterval(progressInterval);
    setUploadProgress(100);
    
    if (result) {
      setAnalysisResult(result);
      
      // Save analysis to profile if user is logged in
      if (user) {
        try {
          await supabase.from('style_analyses').insert({
            user_id: user.id,
            skin_tone: result.skinTone,
            body_structure: result.bodyStructure,
            style_category: result.styleCategory,
            color_palette: result.colorPalette,
            recommendations: result.recommendations,
          });
          
          // Update profile with latest analysis
          await supabase.from('profiles').update({
            skin_tone: result.skinTone,
            body_structure: result.bodyStructure,
            style_category: result.styleCategory,
            color_palette: result.colorPalette,
          }).eq('user_id', user.id);
        } catch (error) {
          console.error('Error saving analysis:', error);
        }
      }
    }
  };

  const clearImage = () => {
    setImage(null);
    setAnalysisResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get matching products based on analysis
  const matchingProducts = useMemo(() => {
    if (!analysisResult) return products.slice(0, 8);
    
    // Filter products by colors that match the palette
    const paletteColors = analysisResult.colorPalette.map(c => c.toLowerCase());
    
    return products
      .filter(product => {
        const productColors = product.colors.map(c => c.toLowerCase());
        // Check if any product color relates to the palette
        return productColors.some(pc => {
          if (paletteColors.some(pal => {
            // Simple color matching heuristic
            if (pc.includes('black') || pc.includes('dark')) return pal.includes('#1') || pal.includes('#2');
            if (pc.includes('white') || pc.includes('cream')) return pal.includes('#e') || pal.includes('#f');
            if (pc.includes('navy') || pc.includes('blue')) return pal.includes('#1a') || pal.includes('#3b');
            return true;
          })) return true;
          return false;
        });
      })
      .slice(0, 8);
  }, [analysisResult]);

  // Camera icon drawing animation
  const cameraPathTransition = {
    pathLength: { duration: 1.5, ease: premiumEase },
    opacity: { duration: 0.3 },
  };

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Header */}
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-12">
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: premiumEase }}
          >
            <Camera className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Analysis</span>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: premiumEase }}
          >
            Style Advisor
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: premiumEase }}
          >
            Upload a photo and let our AI analyze your unique features to find 
            the perfect styles that complement you.
          </motion.p>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Upload Section */}
          <ScrollReveal direction="left" delay={0.2}>
            <div className="bg-card border border-border rounded-3xl p-8">
              <h2 className="text-xl font-semibold mb-6">Upload Your Photo</h2>
              
              {!image ? (
                <motion.div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary)/0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {/* Animated camera icon */}
                  <motion.div 
                    className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <motion.svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground"
                    >
                      <motion.path
                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={cameraPathTransition}
                      />
                      <motion.polyline
                        points="17 8 12 3 7 8"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={cameraPathTransition}
                      />
                      <motion.line
                        x1="12"
                        y1="3"
                        x2="12"
                        y2="15"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={cameraPathTransition}
                      />
                    </motion.svg>
                  </motion.div>
                  <motion.h3 
                    className="font-medium mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Click to upload or drag and drop
                  </motion.h3>
                  <motion.p 
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    PNG, JPG up to 10MB
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: premiumEase }}
                >
                  <img
                    src={image}
                    alt="Uploaded"
                    className="w-full aspect-[3/4] object-cover rounded-2xl"
                  />
                  <motion.button
                    onClick={clearImage}
                    className="absolute top-4 right-4 p-2 bg-background/90 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={20} />
                  </motion.button>
                </motion.div>
              )}

              {/* Instructions */}
              <motion.div 
                className="mt-6 p-4 bg-muted/50 rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="font-medium mb-2">Tips for best results:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Upload a clear, front-facing photo</li>
                  <li>• Ensure good lighting</li>
                  <li>• Wear fitted clothing for accurate body analysis</li>
                  <li>• Keep a neutral expression</li>
                </ul>
              </motion.div>

              {/* Analyze Button */}
              <AnimatePresence>
                {image && !analysisResult && (
                  <motion.button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full btn-primary mt-6 flex items-center justify-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing your style...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Analyze My Style
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </ScrollReveal>

          {/* Results Section */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card border border-border rounded-3xl p-8"
                >
                  <div className="text-center py-12">
                    <motion.div 
                      className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6"
                      animate={{ 
                        boxShadow: ['0 0 0 0 rgba(0,0,0,0.2)', '0 0 0 20px rgba(0,0,0,0)', '0 0 0 0 rgba(0,0,0,0.2)']
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-10 h-10 text-primary-foreground" />
                      </motion.div>
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">Analyzing Your Photo</h3>
                    <p className="text-muted-foreground mb-6">
                      Our AI is evaluating your skin tone, body structure, and style preferences...
                    </p>
                    
                    {/* Animated progress bar */}
                    <div className="max-w-xs mx-auto mb-6">
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      {['Detecting skin tone...', 'Analyzing body structure...', 'Generating style profile...'].map((step, i) => (
                        <motion.div 
                          key={i} 
                          className="flex items-center gap-3 justify-center text-sm"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.3 }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader2 className="w-4 h-4 text-primary" />
                          </motion.div>
                          <span className="text-muted-foreground">{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {analysisResult && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Analysis Cards */}
                  <div className="bg-card border border-border rounded-3xl p-8">
                    <motion.div 
                      className="flex items-center gap-3 mb-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <motion.div 
                        className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold">Analysis Complete</h3>
                        <p className="text-sm text-muted-foreground">Your personalized style profile</p>
                      </div>
                    </motion.div>

                    <StaggerContainer className="grid gap-4" staggerDelay={0.1}>
                      {/* Skin Tone */}
                      <StaggerItem>
                        <motion.div 
                          className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                          whileHover={{ scale: 1.02, x: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                            <Palette className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Skin Tone</p>
                            <p className="font-semibold">{analysisResult.skinTone}</p>
                          </div>
                        </motion.div>
                      </StaggerItem>

                      {/* Body Structure */}
                      <StaggerItem>
                        <motion.div 
                          className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                          whileHover={{ scale: 1.02, x: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                            <Ruler className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Body Structure</p>
                            <p className="font-semibold">{analysisResult.bodyStructure}</p>
                          </div>
                        </motion.div>
                      </StaggerItem>

                      {/* Style Category */}
                      <StaggerItem>
                        <motion.div 
                          className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                          whileHover={{ scale: 1.02, x: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                            <Shirt className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Style Category</p>
                            <p className="font-semibold">{analysisResult.styleCategory}</p>
                          </div>
                        </motion.div>
                      </StaggerItem>
                    </StaggerContainer>

                    {/* Color Palette with animation */}
                    <motion.div 
                      className="mt-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h4 className="font-medium mb-3">Your Color Palette</h4>
                      <div className="flex gap-3">
                        {analysisResult.colorPalette.map((color, i) => (
                          <motion.div
                            key={i}
                            className="w-12 h-12 rounded-xl shadow-sm border border-border"
                            style={{ backgroundColor: color }}
                            title={color}
                            initial={{ opacity: 0, scale: 0, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                            whileHover={{ scale: 1.1, y: -5 }}
                          />
                        ))}
                      </div>
                    </motion.div>

                    {/* Recommendations */}
                    <motion.div 
                      className="mt-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <h4 className="font-medium mb-3">Style Tips</h4>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((rec, i) => (
                          <motion.li 
                            key={i} 
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.9 + i * 0.1 }}
                          >
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            {rec}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {!image && !isAnalyzing && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-3xl p-8"
                >
                  <div className="text-center py-12">
                    <motion.div 
                      className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <User className="w-10 h-10 text-muted-foreground" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">Upload a Photo to Get Started</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Our AI will analyze your unique features and create a personalized style profile just for you.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Matching Products with drop-in animation */}
        <AnimatePresence>
          {analysisResult && (
            <motion.section
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: premiumEase }}
              className="mt-16"
            >
              <motion.div 
                className="flex items-center gap-3 mb-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div 
                  className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold">Curated For You</h2>
                  <p className="text-muted-foreground">Items that match your style profile</p>
                </div>
              </motion.div>

              <div className="grid-product">
                {matchingProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default StyleAdvisor;
