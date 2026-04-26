import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  User, 
  Mic, 
  Image,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { products, formatPrice, Product } from '@/data/products';
import { getProductImage } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  products?: Product[];
  timestamp: Date;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your Switch AI Assistant. 👋 Tell me what you're looking for, and I'll help you find the perfect outfit. You can ask me things like:\n\n• \"Show me black shirts under ₹1500\"\n• \"Casual outfit for college\"\n• \"Formal wear for office\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findProducts = (query: string): Product[] => {
    const lowerQuery = query.toLowerCase();
    
    return products.filter(product => {
      const matchesName = product.name.toLowerCase().includes(lowerQuery);
      const matchesCategory = product.category.toLowerCase().includes(lowerQuery) ||
        (lowerQuery.includes('men') && product.category === 'men') ||
        (lowerQuery.includes('women') && product.category === 'women');
      const matchesColor = product.colors.some(c => lowerQuery.includes(c.toLowerCase()));
      const matchesOccasion = product.occasion.some(o => lowerQuery.includes(o.toLowerCase()));
      const matchesSubcategory = product.subcategory.toLowerCase().includes(lowerQuery);
      
      // Price filter
      const priceMatch = lowerQuery.match(/under\s*₹?\s*(\d+)/);
      if (priceMatch) {
        const maxPrice = parseInt(priceMatch[1]);
        return product.price <= maxPrice && (matchesName || matchesCategory || matchesColor || matchesOccasion || matchesSubcategory);
      }
      
      return matchesName || matchesColor || matchesOccasion || matchesSubcategory || matchesCategory;
    }).slice(0, 4);
  };

  const generateResponse = (query: string, foundProducts: Product[]): string => {
    const lowerQuery = query.toLowerCase();
    
    if (foundProducts.length === 0) {
      return "I couldn't find exact matches for your query. Let me show you some similar items that might interest you! Try being more specific about colors, occasions, or price range.";
    }
    
    if (lowerQuery.includes('casual')) {
      return `Perfect! Here are some casual picks for you. These are great for everyday wear and super comfortable! 😊`;
    }
    
    if (lowerQuery.includes('formal') || lowerQuery.includes('office')) {
      return `Looking sharp! Here are some formal options that are perfect for the office or important meetings. 👔`;
    }
    
    if (lowerQuery.includes('party')) {
      return `Time to turn heads! These party-ready pieces will make you stand out. 🎉`;
    }
    
    if (lowerQuery.match(/under\s*₹?\s*\d+/)) {
      return `Great finds within your budget! Here are some stylish options that won't break the bank. 💰`;
    }
    
    return `I found ${foundProducts.length} items that match your style! Take a look at these curated picks. ✨`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const foundProducts = findProducts(input);
    const response = generateResponse(input, foundProducts);
    
    const displayProducts = foundProducts.length > 0 ? foundProducts : products.slice(0, 4);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: response,
      products: displayProducts,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, aiMessage]);
  };

  const suggestedQueries = [
    "Black shirts under ₹1500",
    "Casual outfit for college",
    "Party wear for women",
    "Formal office attire",
  ];

  return (
    <Layout showFooter={false}>
      <div className="h-[calc(100vh-5rem)] flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container-custom py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Shopping Assistant</h1>
                <p className="text-sm text-muted-foreground">Ask me anything about fashion <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded ml-2 font-bold uppercase tracking-tighter">Simulated</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="container-custom py-6 space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                    message.type === 'ai' 
                      ? 'bg-gradient-to-br from-primary to-accent' 
                      : 'bg-muted'
                  }`}>
                    {message.type === 'ai' ? (
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 max-w-2xl ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-card border border-border rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-line">{message.content}</p>
                    </div>

                    {/* Product Cards */}
                    {message.products && message.products.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {message.products.map((product) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            className="block bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors group"
                          >
                            <div className="aspect-square overflow-hidden">
                              <img
                                src={getProductImage(product)}
                                alt={product.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-sm line-clamp-1 mb-1">{product.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{formatPrice(product.price)}</span>
                                {product.originalPrice && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    {formatPrice(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="p-4 bg-card border border-border rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested Queries */}
        {messages.length === 1 && (
          <div className="border-t border-border bg-card/50">
            <div className="container-custom py-4">
              <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((query) => (
                  <button
                    key={query}
                    onClick={() => {
                      setInput(query);
                      inputRef.current?.focus();
                    }}
                    className="px-4 py-2 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border bg-card">
          <div className="container-custom py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3"
            >
              <button
                type="button"
                className="p-3 hover:bg-muted rounded-full transition-colors"
              >
                <Image size={20} className="text-muted-foreground" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about fashion..."
                className="flex-1 input-premium"
              />
              <button
                type="button"
                className="p-3 hover:bg-muted rounded-full transition-colors"
              >
                <Mic size={20} className="text-muted-foreground" />
              </button>
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIAssistant;
