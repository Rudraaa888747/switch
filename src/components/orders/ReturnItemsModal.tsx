import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabaseRestInsert } from '@/integrations/supabase/publicRest';
import { toast } from 'sonner';
import { RETURN_REASON_OPTIONS } from '@/lib/returnReasons';

interface ReturnableOrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
}

interface ReturnableOrder {
  id: string;
  order_id?: string;
  source_id: string;
  user_id: string;
  payment_method?: string | null;
  items: ReturnableOrderItem[];
}

interface ReturnItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ReturnableOrder;
  onSuccess: () => void;
  accessToken?: string | null;
}

const ReturnItemsModal = ({ isOpen, onClose, order, onSuccess, accessToken }: ReturnItemsModalProps) => {
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [refundMethod, setRefundMethod] = useState<'card' | 'upi' | 'cod'>(
    order.payment_method === 'cod' ? 'cod' : 'card'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const toggleItem = (itemId: string, maxQty: number) => {
    const next = new Map(selectedItems);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.set(itemId, maxQty);
    }
    setSelectedItems(next);
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    if (!reason) {
      toast.error('Please select a return reason');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestRows = await supabaseRestInsert<{ id: string }[]>(
        'return_requests',
        [
          {
            order_id: order.source_id,
            user_id: order.user_id,
            reason,
            comment: comment || null,
            additional_details: comment || null,
            images: [],
            status: 'requested',
            refund_method: refundMethod === 'cod' ? 'wallet' : refundMethod,
          },
        ],
        accessToken
      );

      const requestData = requestRows[0];

      const returnItems = Array.from(selectedItems.entries()).map(([itemId, qty]) => ({
        return_request_id: requestData.id,
        order_item_id: itemId,
        quantity: qty,
      }));

      await supabaseRestInsert('return_request_items', returnItems, accessToken);

      setStep(3);
      toast.success('Return request submitted successfully');
      onSuccess();
    } catch (error: unknown) {
      console.error('Return error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border/50 w-full max-w-lg overflow-hidden shadow-2xl rounded-2xl"
      >
        <div className="px-8 py-6 flex items-center justify-between border-b border-border/40 bg-muted/30">
          <div>
            <h2 className="text-xl font-bold tracking-tight uppercase">Return Request</h2>
            <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
              Order #{order.order_id || order.id}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">1</div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Select Items to Return</h3>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id, item.quantity)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedItems.has(item.id)
                          ? 'bg-primary/5 border-primary shadow-sm'
                          : 'bg-muted/20 border-border/40 hover:border-border'
                      }`}
                    >
                      <div className="relative group">
                        <img
                          src={item.product_image || '/placeholder.svg'}
                          alt={item.product_name}
                          className="w-16 h-20 object-cover rounded-lg shadow-sm group-hover:scale-105 transition-transform"
                        />
                        <div className={`absolute inset-0 flex items-center justify-center rounded-lg transition-opacity ${selectedItems.has(item.id) ? 'bg-primary/20 opacity-100' : 'opacity-0'}`}>
                          <CheckCircle2 className="text-primary h-6 w-6" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={selectedItems.size === 0}
                    className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    Next Step
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">2</div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Return Reason</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Select Return Reason *</label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger className="w-full h-12 bg-muted/20 border-border/40 rounded-xl focus:ring-primary">
                        <SelectValue placeholder="Select a reason..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        {RETURN_REASON_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Refund Method</label>
                    <Select value={refundMethod} onValueChange={(value) => setRefundMethod(value as typeof refundMethod)}>
                      <SelectTrigger className="w-full h-12 bg-muted/20 border-border/40 rounded-xl focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        <SelectItem value="card">Card refund</SelectItem>
                        <SelectItem value="upi">UPI refund</SelectItem>
                        <SelectItem value="cod">Cash on Delivery refund</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      COD refunds are credited to your wallet automatically for faster processing.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Additional Comments (Optional)</label>
                    <Textarea
                      placeholder="Share more details about your return request..."
                      className="min-h-[110px] bg-muted/20 border-border/40 rounded-xl focus:ring-primary resize-none p-4"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="h-12 flex-1 rounded-xl text-xs uppercase font-bold tracking-widest">
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !reason}
                    className="h-12 flex-[2] rounded-xl text-xs uppercase font-bold tracking-widest shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Return Request'}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-6"
              >
                <div className="relative inline-block">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/20"
                  >
                    <CheckCircle2 size={40} className="text-white" />
                  </motion.div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Request Submitted</h3>
                  <p className="text-muted-foreground mt-2 max-w-[280px] mx-auto text-sm">
                    Your return request has been submitted successfully. A support agent will review it shortly.
                  </p>
                </div>
                <div className="pt-4">
                  <Button onClick={onClose} className="w-full h-12 rounded-xl text-xs uppercase font-bold tracking-widest">
                    Back to My Orders
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ReturnItemsModal;
