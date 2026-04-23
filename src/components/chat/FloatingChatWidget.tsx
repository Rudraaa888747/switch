import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, type Easing } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles,
  Minus,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { products, formatPrice, Product, getProductById } from '@/data/products';
import { useAIChat } from '@/hooks/useAIChat';
import { getProductImage } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  products?: Product[];
  timestamp: Date;
}

// Premium easing curve
const premiumEase: Easing = [0.4, 0, 0.2, 1];

// Extract product IDs from AI response [PRODUCTS: id1, id2]
const extractProductIds = (content: string): string[] => {
  const match = content.match(/\[PRODUCTS?:\s*([^\]]+)\]/i);
  if (match) {
    return match[1].split(',').map(id => id.trim()).filter(id => id);
  }
  return [];
};

// Remove product tag from display content
const cleanContent = (content: string): string => {
  return content.replace(/\[PRODUCTS?:\s*[^\]]+\]/gi, '').trim();
};

// Fallback: Find products based on user query
const findMatchingProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  
  let categoryFilter: ('men' | 'women' | 'unisex')[] = [];
  
  if (lowerQuery.includes('women') || lowerQuery.includes('female') || 
      lowerQuery.includes('ladies') || lowerQuery.includes('dress') ||
      lowerQuery.includes('kurti')) {
    categoryFilter = ['women'];
  } else if (lowerQuery.includes('shirt') || lowerQuery.includes('t-shirt') ||
             lowerQuery.includes('jacket') || lowerQuery.includes('men')) {
    categoryFilter = ['men'];
  } else if (lowerQuery.includes('sneaker') || lowerQuery.includes('unisex')) {
    categoryFilter = ['unisex'];
  }
  
  let maxPrice = Infinity;
  const priceMatch = lowerQuery.match(/(?:under|below|less than|max|upto)\s*(?:₹|rs\.?)?\s*(\d+)/i);
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[1]);
  }
  
  const colors = ['black', 'white', 'navy', 'blue', 'red', 'pink', 'grey'];
  const colorFilter = colors.filter(c => lowerQuery.includes(c));
  
  return products.filter(product => {
    if (categoryFilter.length > 0 && !categoryFilter.includes(product.category)) {
      return false;
    }
    if (product.price > maxPrice) {
      return false;
    }
    if (colorFilter.length > 0) {
      const productColors = product.colors.map(c => c.toLowerCase());
      if (!colorFilter.some(c => productColors.some(pc => pc.includes(c)))) {
        return false;
      }
    }
    return true;
  }).slice(0, 4);
};

const WELCOME_MESSAGE = `Hi there! 👋 I'm your Switch AI Assistant.
Need help finding the perfect outfit? Just ask me things like:
🧥 "Black shirt under ₹1500"
👗 "Show me women's dresses"
🎁 "Best gift for men under ₹2000"

I'm here to make your shopping smarter — let's find your style!`;

// Typewriter effect for bot messages
const TypewriterMessage = ({ content, onComplete }: { content: string; onComplete?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 15);
      return () => clearTimeout(timeout);
    } else {
      onComplete?.();
    }
  }, [currentIndex, content, onComplete]);

  return <span className="whitespace-pre-line">{displayedContent}</span>;
};

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcomeTypewriter, setShowWelcomeTypewriter] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useAIChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsTyping(true);

    // Fallback products based on query
    const fallbackProducts = findMatchingProducts(userInput);

    // Build message history for AI
    const chatHistory = messages
      .filter(m => m.id !== '1')
      .map(m => ({
        role: m.type === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));
    
    chatHistory.push({ role: 'user', content: userInput });

    let aiResponse = '';
    
    await sendMessage(
      chatHistory,
      (delta) => {
        aiResponse += delta;
        
        // Display clean content (without product tags)
        const displayContent = cleanContent(aiResponse);
        
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.type === 'ai' && lastMessage.id.startsWith('streaming-')) {
            return prev.map((m, i) => 
              i === prev.length - 1 
                ? { ...m, content: displayContent }
                : m
            );
          }
          return [
            ...prev,
            {
              id: `streaming-${Date.now()}`,
              type: 'ai' as const,
              content: displayContent,
              timestamp: new Date(),
            }
          ];
        });
      },
      () => {
        setIsTyping(false);
        
        // Extract product IDs from AI response
        const productIds = extractProductIds(aiResponse);
        let finalProducts: Product[] = [];
        
        if (productIds.length > 0) {
          finalProducts = productIds
            .map(id => getProductById(id))
            .filter((p): p is Product => p !== undefined);
        }
        
        // Use fallback if no products from AI
        if (finalProducts.length === 0 && fallbackProducts.length > 0) {
          // Check if the query seems product-related
          const productKeywords = ['shirt', 'dress', 'jeans', 'hoodie', 'jacket', 'kurti', 'sneaker', 'shoe', 'show', 'find', 'want', 'need', 'buy'];
          const isProductQuery = productKeywords.some(k => userInput.toLowerCase().includes(k));
          if (isProductQuery) {
            finalProducts = fallbackProducts;
          }
        }
        
        const finalContent = cleanContent(aiResponse);
        
        setMessages(prev => prev.map((m, i) => 
          i === prev.length - 1 && m.type === 'ai'
            ? { 
                ...m, 
                id: Date.now().toString(), 
                content: finalContent,
                products: finalProducts.length > 0 ? finalProducts : undefined 
              }
            : m
        ));
      }
    );
  };

  const quickActions = [
    "Black shirt under ₹1500",
    "Women's dresses",
    "Size guide",
  ];

  return (
    <>
      {/* Floating Button with pulse animation */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-foreground text-background rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
          >
            {/* Pulse ring animation */}
            <motion.div
              className="absolute inset-0 rounded-full bg-foreground"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <MessageCircle className="w-6 h-6 relative z-10" />
            <motion.span 
              className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window with spring animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '550px'
            }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <motion.div 
              className="bg-foreground text-background px-4 py-3 flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-8 h-8 bg-background/20 rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <div>
                  <h3 className="font-medium text-sm">Switch AI Assistant</h3>
                  <p className="text-xs opacity-80">Your style expert</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-background/20 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Minus size={16} />
                </motion.button>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-background/20 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} />
                </motion.button>
              </div>
            </motion.div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: index === 0 ? 0.2 : 0,
                          ease: premiumEase 
                        }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[90%] ${message.type === 'user' ? 'order-2' : ''}`}>
                          <motion.div 
                            className={`px-4 py-2.5 rounded-2xl text-sm ${
                              message.type === 'user'
                                ? 'bg-foreground text-background rounded-br-sm'
                                : 'bg-muted rounded-bl-sm'
                            }`}
                            whileHover={{ scale: 1.01 }}
                          >
                            {message.id === '1' && showWelcomeTypewriter ? (
                              <TypewriterMessage 
                                content={message.content} 
                                onComplete={() => setShowWelcomeTypewriter(false)}
                              />
                            ) : (
                              <p className="whitespace-pre-line">{message.content}</p>
                            )}
                          </motion.div>

                          {/* Product Cards with staggered animation */}
                          {message.products && message.products.length > 0 && (
                            <motion.div 
                              className="mt-3 space-y-2"
                              initial="hidden"
                              animate="visible"
                              variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                  opacity: 1,
                                  transition: { staggerChildren: 0.1 },
                                },
                              }}
                            >
                              {message.products.map((product) => (
                                <motion.div
                                  key={product.id}
                                  variants={{
                                    hidden: { opacity: 0, x: -20, filter: 'blur(4px)' },
                                    visible: { opacity: 1, x: 0, filter: 'blur(0px)' },
                                  }}
                                  transition={{ duration: 0.4, ease: premiumEase }}
                                >
                                  <Link
                                    to={`/product/${product.id}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block p-3 bg-card rounded-xl border border-border hover:border-foreground/30 hover:shadow-md transition-all"
                                  >
                                    <div className="flex gap-3">
                                      <motion.div 
                                        className="w-20 h-24 bg-muted rounded-lg flex-shrink-0 overflow-hidden"
                                        whileHover={{ scale: 1.05 }}
                                      >
                                        {getProductImage(product) ? (
                                          <img
                                            src={getProductImage(product)}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                            No image
                                          </div>
                                        )}
                                      </motion.div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                          {product.category}
                                        </p>
                                        <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h4>
                                        <div className="flex items-center gap-1 mb-1">
                                          <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={i}
                                                size={10}
                                                className={i < Math.floor(product.rating) 
                                                  ? 'fill-foreground text-foreground' 
                                                  : 'text-muted-foreground/30'}
                                              />
                                            ))}
                                          </div>
                                          <span className="text-[10px] text-muted-foreground">
                                            ({product.reviews})
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-sm">{formatPrice(product.price)}</span>
                                          {product.originalPrice && (
                                            <>
                                              <span className="text-xs text-muted-foreground line-through">
                                                {formatPrice(product.originalPrice)}
                                              </span>
                                              <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded">
                                                {product.discount}% OFF
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        <div className="flex gap-1 mt-1.5 flex-wrap">
                                          {product.colors.slice(0, 3).map((color) => (
                                            <span key={color} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                                              {color}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing Indicator with animated dots */}
                    <AnimatePresence>
                      {isTyping && messages[messages.length - 1]?.type !== 'ai' && (
                        <motion.div 
                          className="flex justify-start"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.span 
                                  key={i}
                                  className="w-2 h-2 bg-muted-foreground rounded-full"
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{
                                    duration: 0.6,
                                    delay: i * 0.15,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Actions with staggered appearance */}
                  <AnimatePresence>
                    {messages.length <= 2 && (
                      <motion.div 
                        className="px-4 pb-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <div className="flex flex-wrap gap-2">
                          {quickActions.map((action, index) => (
                            <motion.button
                              key={action}
                              onClick={() => setInput(action)}
                              className="px-3 py-1.5 text-xs bg-muted rounded-full hover:bg-muted/80 transition-colors"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 + 0.5 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {action}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input with focus animation */}
                  <motion.div 
                    className="p-4 border-t border-border"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                      }}
                      className="flex items-center gap-2"
                    >
                      <motion.input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about products..."
                        disabled={isTyping}
                        className="flex-1 px-4 py-2.5 bg-muted rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50 transition-all duration-300"
                        whileFocus={{ scale: 1.02 }}
                      />
                      <motion.button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="p-2.5 bg-foreground text-background rounded-full hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Send size={16} />
                      </motion.button>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatWidget;
