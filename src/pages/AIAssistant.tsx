import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  User, 
  Mic, 
  Image,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAIChat } from '@/hooks/useAIChat';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice, Product } from '@/data/products';
import { getProductImage } from '@/lib/utils';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  productIds?: string[];
  products?: Product[];
  timestamp: Date;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your Switch AI Assistant. 👋 Tell me what you're looking for, and I'll help you find the perfect outfit. You can ask me about products, get style tips, or fashion advice!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isLoading } = useAIChat();
  const { data: dbProducts = [] } = useProducts();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const extractProductIds = (text: string): string[] => {
    const match = text.match(/\[PRODUCTS:\s*([^\]]+)\]/);
    if (match) {
      return match[1].split(',').map(id => id.trim()).filter(Boolean);
    }
    return [];
  };

  const stripProductTag = (text: string): string => {
    return text.replace(/\s*\[PRODUCTS:[^\]]*\]/g, '');
  };

  const resolveProducts = useCallback((ids: string[]): Product[] => {
    if (ids.length === 0 || dbProducts.length === 0) return [];
    return dbProducts.filter(p => ids.includes(p.id)).slice(0, 8);
  }, [dbProducts]);

  useEffect(() => {
    if (pendingProductIds.length > 0) {
      const resolved = resolveProducts(pendingProductIds);
      if (resolved.length > 0) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.type === 'ai' && last.products === undefined) {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, products: resolved, productIds: pendingProductIds };
            return updated;
          }
          return prev;
        });
        setPendingProductIds([]);
      }
    }
  }, [pendingProductIds, resolveProducts]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const query = input;
    setInput('');
    setStreamingText('');

    const chatHistory = messages
      .filter(m => m.id !== '1')
      .map(m => ({
        role: m.type === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

    let fullResponse = '';
    let ids: string[] = [];

    await sendMessage(
      [...chatHistory, { role: 'user', content: query }],
      (delta) => {
        fullResponse += delta;
        setStreamingText(fullResponse);
        const extracted = extractProductIds(fullResponse);
        if (extracted.length > 0) ids = extracted;
      },
      () => {
        const cleanText = stripProductTag(fullResponse);
        setStreamingText('');
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: cleanText || "I couldn't process that. Please try asking about our products, styles, or fashion tips!",
          productIds: ids,
          timestamp: new Date(),
        }]);
        if (ids.length > 0) {
          setPendingProductIds(ids);
        }
      }
    );
  };

  const suggestedQueries = [
    "Show me black shirts",
    "Casual outfit ideas",
    "What's trending?",
    "Office wear suggestions",
  ];

  return (
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
                <p className="text-sm text-muted-foreground">Powered by Gemini AI</p>
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

                  <div className={`flex-1 max-w-2xl ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-card border border-border rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-line">{message.content}</p>
                    </div>

                    {message.products && message.products.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* Streaming Response */}
            {streamingText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="p-4 bg-card border border-border rounded-2xl rounded-tl-none">
                  <p className="whitespace-pre-line">{streamingText}</p>
                </div>
              </motion.div>
            )}

            {/* Loading Indicator */}
            {isLoading && !streamingText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="p-4 bg-card border border-border rounded-2xl rounded-tl-none">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
                aria-label="Upload image"
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
                disabled={isLoading}
              />
              <button
                type="button"
                className="p-3 hover:bg-muted rounded-full transition-colors"
                aria-label="Voice input"
              >
                <Mic size={20} className="text-muted-foreground" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
          </div>
        </div>
      </div>
  );
};

export default AIAssistant;
