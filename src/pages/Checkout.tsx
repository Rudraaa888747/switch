import { useMemo, useRef, useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, CreditCard, Check, Shield, Package, ArrowRight, CheckCircle2, Wallet, Truck } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, type Product } from '@/data/products';
import { toast } from '@/hooks/use-toast';
import { getProductImage } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import CouponInput from '@/components/checkout/CouponInput';
import { getUserOrdersQueryKey } from '@/hooks/useOrders';
import { useQueryClient } from '@tanstack/react-query';
import { createAdminNotification } from '@/lib/adminNotifications';

type Step = 'address' | 'payment' | 'confirmation';

interface AddressForm {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface CouponData {
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_amount: number;
}

interface CheckoutCartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

interface SummaryProps {
  items: CheckoutCartItem[];
  totalPrice: number;
  tax: number;
  grandTotal: number;
  couponDiscount: number;
  appliedCoupon: CouponData | null;
  walletApplied?: number;
  showCouponInput?: boolean;
  onCouponApply?: (discount: number, couponData: CouponData | null) => void;
}

const paymentMethods = [
  { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Rupay', accent: 'from-white/14 via-white/3 to-transparent' },
  { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm', accent: 'from-white/14 via-white/3 to-transparent' },
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', accent: 'from-white/14 via-white/3 to-transparent' },
] as const;

const OrderSummary = ({
  items,
  totalPrice,
  tax,
  grandTotal,
  couponDiscount,
  appliedCoupon,
  walletApplied = 0,
  showCouponInput = false,
  onCouponApply,
}: SummaryProps) => (
  <div className="mobile-glass-panel rounded-[1.8rem] p-5 md:p-6">
    <div className="mb-5">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Payment Summary</p>
      <h3 className="mt-2 text-lg font-semibold">Order summary</h3>
    </div>

    {showCouponInput && onCouponApply && (
      <div className="mb-5">
        <CouponInput subtotal={totalPrice} onApplyCoupon={onCouponApply} isAuthenticated />
      </div>
    )}

    <div className="mb-5 space-y-3">
      {items.map((item) => (
        <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-3 rounded-[1.2rem] border border-border/70 bg-card/70 p-3">
          <div className="h-16 w-14 flex-shrink-0 overflow-hidden rounded-[0.9rem] bg-muted">
            <img src={getProductImage(item.product, item.color)} alt={item.product.name} className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-medium">{item.product.name}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {item.size} • {item.color} • Qty {item.quantity}
            </p>
            <p className="mt-1 text-sm font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="space-y-3 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(totalPrice)}</span></div>
      {couponDiscount > 0 && (
        <div className="flex justify-between text-emerald-600">
          <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
          <span>-{formatPrice(couponDiscount)}</span>
        </div>
      )}
      <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-emerald-600">Included</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatPrice(tax)}</span></div>
      {walletApplied > 0 && (
        <div className="flex justify-between text-foreground">
          <span className="text-muted-foreground">Wallet applied</span>
          <span>-{formatPrice(walletApplied)}</span>
        </div>
      )}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(Math.max(grandTotal - walletApplied, 0))}</span>
        </div>
      </div>
    </div>
  </div>
);

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated, isAuthReady, supabaseUser, session, updateProfile } = useAuth();
  const walletBalance = user?.walletBalance ?? 0;
  const queryClient = useQueryClient();
  const addressFormRef = useRef<HTMLFormElement>(null);
  const paymentFormRef = useRef<HTMLFormElement>(null);
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('card');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string; total: number; discount: number; couponCode?: string } | null>(null);
  const [useWallet, setUseWallet] = useState(true);

  const withTimeout = async <T,>(promise: Promise<T>, message: string, ms = 18000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  };

  const createOrderRecord = async (payload: Record<string, unknown>) => {
    const { data, error } = await withTimeout(
      supabase
        .from('orders')
        .insert(payload)
        .select('id')
        .single(),
      'Order create request timed out',
    );

    if (error) {
      throw error;
    }

    return data?.id as string;
  };

  const shipping = 0;
  const tax = Math.round((totalPrice - couponDiscount) * 0.18);
  const grandTotal = totalPrice - couponDiscount + shipping + tax;
  const maxWalletPossible = Math.min(walletBalance, Math.max(grandTotal, 0));
  const walletApplied = useWallet ? maxWalletPossible : 0;
  const remainingTotal = Math.max(grandTotal - walletApplied, 0);
  const canUseWallet = walletBalance > 0 && maxWalletPossible > 0;

  const steps = useMemo(
    () => [
      { id: 'address' as const, label: 'Address', icon: MapPin },
      { id: 'payment' as const, label: 'Payment', icon: CreditCard },
      { id: 'confirmation' as const, label: 'Confirm', icon: Check },
    ],
    [],
  );

  const activeStepIndex = steps.findIndex((step) => step.id === currentStep);

  const handleCouponApply = (discount: number, couponData: CouponData | null) => {
    setCouponDiscount(discount);
    setAppliedCoupon(couponData);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.phone || !addressForm.address || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (addressForm.phone.length !== 10) {
      toast({ title: 'Please enter a valid 10-digit phone number', variant: 'destructive' });
      return;
    }

    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (remainingTotal > 0 && paymentMethod === 'card') {
      const isValidExpiry = /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry.trim());
      if (cardDetails.number.length !== 16 || !cardDetails.name.trim() || !isValidExpiry || cardDetails.cvv.length !== 3) {
        toast({ title: 'Please enter valid card details', variant: 'destructive' });
        return;
      }
    }

    if (remainingTotal > 0 && paymentMethod === 'upi' && !/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
      toast({ title: 'Please enter a valid UPI ID', variant: 'destructive' });
      return;
    }

    const currentUserId = user?.id || supabaseUser?.id || null;
    if (!currentUserId) {
      toast({ title: 'Please log in to continue', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const newOrderId = `ORD-${timestamp}-${randomStr}`;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
      const dateOnly = estimatedDelivery.toISOString().split('T')[0];
      const finalPaymentMethod = remainingTotal === 0 ? 'wallet' : `${walletApplied > 0 ? 'wallet+' : ''}${paymentMethod}`;

      const orderPayload = {
        order_id: newOrderId,
        user_id: currentUserId,
        status: 'processing',
        estimated_delivery: dateOnly,
        subtotal: totalPrice - couponDiscount,
        tax,
        shipping,
        total: grandTotal,
        items: items.map((item: CheckoutCartItem) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: getProductImage(item.product, item.color),
          quantity: item.quantity,
          price: item.product.price,
          total_price: item.product.price * item.quantity,
          size: item.size,
          color: item.color,
        })),
        customer_name: addressForm.fullName,
        customer_email: addressForm.email || null,
        customer_phone: addressForm.phone,
        shipping_address: addressForm.address,
        shipping_city: addressForm.city,
        shipping_state: addressForm.state,
        shipping_pincode: addressForm.pincode,
        payment_method: finalPaymentMethod,
      };

      let createdOrderId: string | null = null;

      if (walletApplied > 0) {
        let rpcSucceeded = false;
        try {
          const rpcResponse = await Promise.race([
            supabase.rpc('place_order_with_wallet', {
              p_order_id: newOrderId,
              p_user_id: currentUserId,
              p_status: 'processing',
              p_estimated_delivery: dateOnly,
              p_subtotal: totalPrice - couponDiscount,
              p_tax: tax,
              p_shipping: shipping,
              p_total: grandTotal,
              p_items: items.map((item: CheckoutCartItem) => ({
                product_id: item.product.id,
                product_name: item.product.name,
                product_image: getProductImage(item.product, item.color),
                quantity: item.quantity,
                price: item.product.price,
                total_price: item.product.price * item.quantity,
                size: item.size,
                color: item.color,
              })),
              p_customer_name: addressForm.fullName,
              p_customer_email: addressForm.email || null,
              p_customer_phone: addressForm.phone,
              p_shipping_address: addressForm.address,
              p_shipping_city: addressForm.city,
              p_shipping_state: addressForm.state,
              p_shipping_pincode: addressForm.pincode,
              p_payment_method: finalPaymentMethod,
              p_wallet_amount: walletApplied,
            }),
            new Promise<never>((_, reject) => {
              window.setTimeout(() => reject(new Error('Supabase wallet RPC timeout')), 15000);
            }),
          ]);

          if ('error' in rpcResponse && rpcResponse.error) {
            throw rpcResponse.error;
          }

          if ('data' in rpcResponse) {
            const parsed = typeof rpcResponse.data === 'string' ? JSON.parse(rpcResponse.data) : rpcResponse.data;
            rpcSucceeded = !!parsed?.success;
            if (!rpcSucceeded && parsed?.error) {
              throw new Error(parsed.error);
            }
          }
        } catch {
          rpcSucceeded = false;
        }

        if (!rpcSucceeded) {
          createdOrderId = await createOrderRecord(orderPayload);
          const { error: walletError } = await withTimeout(
            supabase.rpc('deduct_wallet_balance', {
              p_user_id: currentUserId,
              p_amount: walletApplied,
              p_reference_id: newOrderId,
              p_description: `Wallet payment for order #${newOrderId}`,
            }),
            'Wallet debit timed out',
          );
          if (walletError) throw walletError;
        }
      } else {
        createdOrderId = await createOrderRecord(orderPayload);
      }

      if (!createdOrderId) {
        const { data: createdOrder } = await withTimeout(
          supabase
            .from('orders')
            .select('id')
            .eq('order_id', newOrderId)
            .maybeSingle(),
          'Order lookup timed out',
        );
        createdOrderId = createdOrder?.id ?? null;
      }

      if (!createdOrderId) {
        throw new Error('Order created but ID could not be resolved');
      }

      const orderItemsPayload = items.map((item: CheckoutCartItem) => ({
          order_id: createdOrderId,
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: getProductImage(item.product, item.color),
          quantity: item.quantity,
          unit_price: item.product.price,
          line_total_amount: item.product.price * item.quantity,
          variant: JSON.stringify({ size: item.size, color: item.color }),
        }));

      const { error: orderItemsError } = await withTimeout(
        supabase.from('order_items').insert(orderItemsPayload),
        'Order items save timed out',
      );
      if (orderItemsError) {
        throw orderItemsError;
      }

      if (appliedCoupon?.code) {
        const { data: couponRow } = await withTimeout(
          supabase
            .from('coupons')
            .select('current_uses')
            .eq('code', appliedCoupon.code)
            .maybeSingle(),
          'Coupon lookup timed out',
        );

        await withTimeout(
          supabase
            .from('coupons')
            .update({ current_uses: Number(couponRow?.current_uses || 0) + 1 })
            .eq('code', appliedCoupon.code),
          'Coupon update timed out',
        );
      }

      await createAdminNotification({
        title: 'New order received',
        message: `${addressForm.fullName} placed ${newOrderId} for ${formatPrice(grandTotal)}.`,
        type: 'info',
        eventType: 'new_order',
        link: '/admin/orders',
        metadata: { orderId: newOrderId, total: grandTotal, paymentMethod: finalPaymentMethod },
      }).catch(() => {});

      if (walletApplied > 0 && currentUserId) {
        updateProfile({ walletBalance: Math.max(0, walletBalance - walletApplied) });
        queryClient.invalidateQueries({ queryKey: ['wallet-profile-balance', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions', currentUserId] });
      }

      setOrderId(newOrderId);
      setConfirmedOrder({ id: newOrderId, total: grandTotal, discount: couponDiscount, couponCode: appliedCoupon?.code });
      queryClient.invalidateQueries({ queryKey: getUserOrdersQueryKey(currentUserId) });
      clearCart();
      setCurrentStep('confirmation');
      toast({ title: 'Order placed successfully' });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
            ? err.message
            : 'Please try again or contact support';
      console.error('Order placement error:', err);
      toast({ title: 'Order failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const submitCurrentStep = () => {
    if (currentStep === 'address') {
      addressFormRef.current?.requestSubmit();
    }
    if (currentStep === 'payment') {
      paymentFormRef.current?.requestSubmit();
    }
  };

  if (isAuthReady && !isAuthenticated) return <Navigate to="/auth" replace />;

  if (items.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="container-custom py-20 text-center">
        <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mb-8 text-muted-foreground">Add some items to checkout</p>
        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <>
      <div className="container-custom py-6 pb-[calc(var(--mobile-content-bottom)+6rem)] md:py-8 md:pb-8">
        {currentStep !== 'confirmation' && (
          <button onClick={() => (currentStep === 'address' ? navigate('/cart') : setCurrentStep('address'))} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <ChevronLeft size={18} />
            {currentStep === 'address' ? 'Back to Cart' : 'Back to Address'}
          </button>
        )}

        {currentStep !== 'confirmation' && (
          <div className="mb-8 flex items-center justify-between gap-2 overflow-x-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isPast = activeStepIndex > index;
              return (
                <div key={step.id} className="flex min-w-0 flex-1 items-center">
                  <div className={`flex flex-1 items-center gap-2 rounded-full px-3 py-2.5 text-xs uppercase tracking-[0.18em] ${
                    isActive ? 'bg-foreground text-background' : isPast ? 'bg-foreground/10 text-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon size={15} />
                    <span className="hidden sm:block">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && <div className={`mx-2 h-px w-4 md:w-10 ${isPast ? 'bg-foreground' : 'bg-border'}`} />}
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 'address' && (
            <motion.div key="address" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="grid gap-6 lg:grid-cols-3 lg:gap-8">
              <div className="lg:col-span-2">
                <div className="rounded-[1.8rem] border border-border/70 bg-card/80 p-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] md:p-8">
                  <h2 className="mb-6 text-xl font-semibold">Delivery Address</h2>

                  <form ref={addressFormRef} onSubmit={handleAddressSubmit} className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Full Name *</label>
                        <input type="text" value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} className="input-premium" placeholder="Enter your full name" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">Phone Number *</label>
                        <input type="tel" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="input-premium" placeholder="10-digit mobile number" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Email Address</label>
                      <input type="email" value={addressForm.email} onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })} className="input-premium" placeholder="Enter your email (optional)" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Address *</label>
                      <textarea value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} className="input-premium min-h-[110px] resize-none" placeholder="House no, Building, Street, Area" />
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium">City *</label>
                        <input type="text" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="input-premium" placeholder="City" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">State *</label>
                        <input type="text" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="input-premium" placeholder="State" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">Pincode *</label>
                        <input type="text" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="input-premium" placeholder="6-digit pincode" />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary hidden w-full items-center justify-center gap-2 md:flex">
                      Continue to Payment
                      <ArrowRight size={16} />
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-1">
                <OrderSummary
                  items={items as CheckoutCartItem[]}
                  totalPrice={totalPrice}
                  tax={tax}
                  grandTotal={grandTotal}
                  couponDiscount={couponDiscount}
                  appliedCoupon={appliedCoupon}
                  onCouponApply={handleCouponApply}
                  showCouponInput
                />
              </div>
            </motion.div>
          )}

          {currentStep === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="grid gap-6 lg:grid-cols-3 lg:gap-8">
              <div className="lg:col-span-2">
                <div className="rounded-[1.8rem] border border-border/70 bg-card/80 p-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] md:p-8">
                  <h2 className="mb-6 text-xl font-semibold">Payment Method</h2>

                  {canUseWallet && (
                    <div onClick={() => setUseWallet(!useWallet)} className={`mb-6 cursor-pointer rounded-[1.5rem] border p-5 transition-all ${useWallet ? 'border-foreground bg-foreground/[0.04]' : 'border-border bg-secondary/20 hover:border-foreground/30'}`}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-3 ${useWallet ? 'bg-foreground/12' : 'bg-secondary'}`}>
                            <Wallet className="h-5 w-5 text-foreground" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Wallet Balance Available</p>
                            <p className="mt-1 text-lg font-bold">{formatPrice(maxWalletPossible)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${useWallet ? 'border-foreground bg-foreground text-background' : 'border-muted-foreground/30'}`}>
                            {useWallet && <Check size={12} />}
                          </div>
                          <span className="text-sm font-medium">{useWallet ? 'Applied' : 'Use Wallet'}</span>
                        </div>
                      </div>
                      <p className="mt-3 border-t border-border/50 pt-3 text-sm text-muted-foreground">
                        {useWallet ? `${formatPrice(maxWalletPossible)} will be applied before your selected payment method.` : 'Tap to apply your wallet balance to this order.'}
                      </p>
                    </div>
                  )}

                  <div className="mb-6 space-y-3">
                    {paymentMethods.map((method) => {
                      const isSelected = paymentMethod === method.id;
                      return (
                        <div key={method.id} className={`overflow-hidden rounded-[1.45rem] border transition-all ${isSelected ? 'border-foreground bg-foreground/[0.04] shadow-[0_20px_45px_-36px_rgba(0,0,0,0.55)]' : 'border-border bg-card'}`}>
                          <label className="flex cursor-pointer items-center gap-4 px-4 py-4">
                            <input type="radio" name="payment" value={method.id} checked={isSelected} onChange={() => setPaymentMethod(method.id)} className="h-4 w-4 text-primary" />
                            <div className="flex-1">
                              <p className="font-medium">{method.label}</p>
                              <p className="text-sm text-muted-foreground">{method.desc}</p>
                            </div>
                          </label>

                          <AnimatePresence initial={false}>
                            {isSelected && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border/60">
                                <div className="bg-gradient-to-br px-4 py-4" style={{ backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.06), transparent 55%)` }}>
                                  {method.id === 'card' && (
                                    <div className="space-y-4">
                                      <div>
                                        <label className="mb-2 block text-sm font-medium">Card Number</label>
                                        <input type="text" value={cardDetails.number} onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, '').slice(0, 16) })} className="input-premium" placeholder="1234 5678 9012 3456" />
                                      </div>
                                      <div>
                                        <label className="mb-2 block text-sm font-medium">Name on Card</label>
                                        <input type="text" value={cardDetails.name} onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })} className="input-premium" placeholder="John Doe" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="mb-2 block text-sm font-medium">Expiry Date</label>
                                          <input type="text" value={cardDetails.expiry} onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })} className="input-premium" placeholder="MM/YY" />
                                        </div>
                                        <div>
                                          <label className="mb-2 block text-sm font-medium">CVV</label>
                                          <input type="password" value={cardDetails.cvv} onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })} className="input-premium" placeholder="•••" />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {method.id === 'upi' && (
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">UPI ID</label>
                                      <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="input-premium" placeholder="yourname@upi" />
                                    </div>
                                  )}

                                  {method.id === 'cod' && (
                                    <div className="rounded-[1rem] border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                                      Pay when your order reaches you. A premium confirmation flow still applies.
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  <form ref={paymentFormRef} onSubmit={handlePaymentSubmit}>
                    <button type="submit" disabled={isProcessing} className="btn-primary hidden w-full items-center justify-center gap-2 md:flex">
                      {isProcessing ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Shield size={16} />
                          Pay {formatPrice(remainingTotal)}
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield size={14} />
                    <span>Your payment information is secure</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <OrderSummary
                  items={items as CheckoutCartItem[]}
                  totalPrice={totalPrice}
                  tax={tax}
                  grandTotal={grandTotal}
                  couponDiscount={couponDiscount}
                  appliedCoupon={appliedCoupon}
                  walletApplied={walletApplied}
                />
              </div>
            </motion.div>
          )}

          {currentStep === 'confirmation' && (
            <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-2xl py-12 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </motion.div>

              <h1 className="mb-2 text-3xl font-bold">Order Confirmed</h1>
              <p className="mb-6 text-lg text-muted-foreground">Thank you for your purchase.</p>

              <div className="mb-8 rounded-[1.8rem] border border-border/70 bg-card/90 p-6 text-left">
                <div className="mb-4 flex items-center justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono font-medium">{confirmedOrder?.id || orderId}</span></div>
                <div className="mb-4 flex items-center justify-between"><span className="text-muted-foreground">Total Amount</span><span className="font-semibold">{formatPrice(confirmedOrder?.total || 0)}</span></div>
                {confirmedOrder?.discount ? (
                  <div className="mb-4 flex items-center justify-between text-green-600"><span>Discount Applied ({confirmedOrder.couponCode})</span><span>-{formatPrice(confirmedOrder.discount)}</span></div>
                ) : null}
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Estimated Delivery</span><span className="font-medium">5-7 Business Days</span></div>
              </div>

              <div className="mb-8 rounded-[1.5rem] bg-muted/50 p-6">
                <h3 className="mb-3 font-semibold">What’s Next</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>You’ll receive an order confirmation email shortly.</p>
                  <p>We’ll notify you when your order ships.</p>
                  <p>Track your order in your profile.</p>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/shop" className="btn-primary">Continue Shopping</Link>
                <Link to="/profile" className="btn-outline">View Orders</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {currentStep !== 'confirmation' && (
        <div className="sticky-mobile-bottom px-3 md:hidden">
          <div className="mobile-glass-panel rounded-[1.8rem] px-4 py-3 safe-bottom">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{currentStep === 'address' ? 'Ready for payment' : 'Payment summary'}</p>
                <p className="mt-1 text-lg font-semibold">{formatPrice(currentStep === 'address' ? grandTotal : remainingTotal)}</p>
              </div>
              <div className="text-right text-[11px] leading-5 text-muted-foreground">
                <p>{items.length} item{items.length !== 1 ? 's' : ''}</p>
                <p>{currentStep === 'address' ? 'Address first' : 'Secure payment'}</p>
              </div>
            </div>
            <button onClick={submitCurrentStep} disabled={isProcessing} className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-3 text-[10px]">
              {currentStep === 'address' ? (
                <>
                  Continue to Payment
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  {isProcessing ? 'Processing...' : `Pay ${formatPrice(remainingTotal)}`}
                  <Truck size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;
