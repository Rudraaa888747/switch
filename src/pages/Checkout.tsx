import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  MapPin, 
  CreditCard, 
  Check, 
  Truck,
  Shield,
  Package,
  ArrowRight,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, type Product } from '@/data/products';
import { toast } from '@/hooks/use-toast';
import { getProductImage } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { supabaseRestInsert } from '@/integrations/supabase/publicRest';
import CouponInput from '@/components/checkout/CouponInput';
import { getUserOrdersQueryKey } from '@/hooks/useOrders';
import { useQueryClient } from '@tanstack/react-query';

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

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated, isAuthReady, supabaseUser, session, updateProfile } = useAuth();
  const walletBalance = user?.walletBalance ?? 0;
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  // Coupon state
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
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [upiId, setUpiId] = useState('');

  // Snapshot for confirmed order details after cart is cleared
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    total: number;
    discount: number;
    couponCode?: string;
  } | null>(null);

  const [useWallet, setUseWallet] = useState(true);

  const shipping = 0; // Free shipping
  const tax = Math.round((totalPrice - couponDiscount) * 0.18); // 18% GST after discount
  const grandTotal = totalPrice - couponDiscount + shipping + tax;
  const maxWalletPossible = Math.min(walletBalance, Math.max(grandTotal, 0));
  const walletApplied = useWallet ? maxWalletPossible : 0;
  const remainingTotal = Math.max(grandTotal - walletApplied, 0);
  const canUseWallet = walletBalance > 0 && maxWalletPossible > 0;

  const steps = [
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'confirmation', label: 'Confirm', icon: Check },
  ];

  const handleCouponApply = (discount: number, couponData: CouponData | null) => {
    setCouponDiscount(discount);
    setAppliedCoupon(couponData);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!addressForm.fullName || !addressForm.phone || !addressForm.address || 
        !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast({
        title: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (addressForm.phone.length !== 10) {
      toast({
        title: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isProcessing) return;

    if (remainingTotal > 0 && paymentMethod === 'card') {
      const isValidExpiry = /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry.trim());
      if (
        cardDetails.number.length !== 16 ||
        !cardDetails.name.trim() ||
        !isValidExpiry ||
        cardDetails.cvv.length !== 3
      ) {
        toast({
          title: 'Please enter valid card details',
          variant: 'destructive',
        });
        return;
      }
    }

    if (remainingTotal > 0 && paymentMethod === 'upi' && !/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
      toast({
        title: 'Please enter a valid UPI ID',
        variant: 'destructive',
      });
      return;
    }

    const currentUserId = user?.id || supabaseUser?.id || null;
    if (!currentUserId) {
      toast({
        title: 'Please log in to continue',
        variant: 'destructive',
      });
      return;
    }
    setIsProcessing(true);

    try {
      // Generate a more robust unique order ID
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const newOrderId = `ORD-${timestamp}-${randomStr}`;

      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
      const dateOnly = estimatedDelivery.toISOString().split('T')[0];

      const finalPaymentMethod = remainingTotal === 0
        ? 'wallet'
        : `${walletApplied > 0 ? 'wallet+' : ''}${paymentMethod}`;

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

      let parsedOrderResult: { success?: boolean; error?: string } | null = null;

      if (walletApplied <= 0) {
        await supabaseRestInsert('orders', [orderPayload], session?.access_token);
        parsedOrderResult = { success: true };
      } else {
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
            window.setTimeout(() => {
              reject(new Error('Order request timed out before reaching Supabase. Please try once more.'));
            }, 30000);
          }),
        ]);

        if ('error' in rpcResponse && rpcResponse.error) {
          const rpcError = rpcResponse.error;
          const isMissingCheckoutRpc =
            rpcError.code === 'PGRST202' ||
            rpcError.code === '42883' ||
            /place_order_with_wallet/i.test(rpcError.message || '');

          if (!isMissingCheckoutRpc) {
            throw rpcError;
          }

          // Legacy compatibility fallback for environments that have not applied the new
          // transactional checkout migration yet.
          await supabaseRestInsert('orders', [orderPayload], session?.access_token);

          const { error: walletError } = await supabase.rpc('deduct_wallet_balance', {
            p_user_id: currentUserId,
            p_amount: walletApplied,
            p_reference_id: newOrderId,
            p_description: `Wallet payment for order #${newOrderId}`,
          });

          if (walletError) {
            throw walletError;
          }

          parsedOrderResult = { success: true };
        } else if ('data' in rpcResponse) {
          parsedOrderResult =
            typeof rpcResponse.data === 'string'
              ? JSON.parse(rpcResponse.data)
              : rpcResponse.data;
        }
      }

      if (!parsedOrderResult?.success) {
        throw new Error(parsedOrderResult?.error || 'Order creation failed');
      }

      if (walletApplied > 0 && currentUserId) {
        updateProfile({ walletBalance: Math.max(0, walletBalance - walletApplied) });
        queryClient.invalidateQueries({ queryKey: ['wallet-profile-balance', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions', currentUserId] });
      }

      setOrderId(newOrderId);
      setConfirmedOrder({
        id: newOrderId,
        total: grandTotal,
        discount: couponDiscount,
        couponCode: appliedCoupon?.code,
      });

      queryClient.invalidateQueries({ queryKey: getUserOrdersQueryKey(currentUserId) });
      clearCart();
      setCurrentStep('confirmation');

      toast({
        title: 'Order placed successfully 🚀',
      });

    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
            ? err.message
            : 'Please try again or contact support';
      console.error('Order placement error:', err);
      toast({
        title: 'Order failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    setIsProcessing(false);
  };

  if (isAuthReady && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (items.length === 0 && currentStep !== 'confirmation') {
    return (
      <Layout>
        <div className="container-custom py-20 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some items to checkout</p>
          <Link to="/shop" className="btn-primary">Continue Shopping</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={currentStep !== 'confirmation'}>
      <div className="container-custom py-8">
        {/* Back Button */}
        {currentStep !== 'confirmation' && (
          <button
            onClick={() => currentStep === 'address' ? navigate('/cart') : setCurrentStep('address')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft size={20} />
            {currentStep === 'address' ? 'Back to Cart' : 'Back to Address'}
          </button>
        )}

        {/* Steps Indicator */}
        {currentStep !== 'confirmation' && (
          <div className="flex items-center justify-center gap-4 mb-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isPast = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isPast 
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon size={18} />
                    <span className="font-medium text-sm hidden sm:block">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 ${
                      isPast ? 'bg-primary' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Address Step */}
          {currentStep === 'address' && (
            <motion.div
              key="address"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-semibold mb-6">Delivery Address</h2>
                  
                  <form onSubmit={handleAddressSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                          className="input-premium"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="input-premium"
                          placeholder="10-digit mobile number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <input
                        type="email"
                        value={addressForm.email}
                        onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                        className="input-premium"
                        placeholder="Enter your email (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Address *</label>
                      <textarea
                        value={addressForm.address}
                        onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                        className="input-premium min-h-[100px] resize-none"
                        placeholder="House no, Building, Street, Area"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2">City *</label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="input-premium"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">State *</label>
                        <input
                          type="text"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          className="input-premium"
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Pincode *</label>
                        <input
                          type="text"
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          className="input-premium"
                          placeholder="6-digit pincode"
                        />
                      </div>
                    </div>

                    <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2 mt-6">
                      Continue to Payment
                      <ArrowRight size={18} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <OrderSummary 
                  items={items} 
                  totalPrice={totalPrice} 
                  tax={tax} 
                  grandTotal={grandTotal}
                  couponDiscount={couponDiscount}
                  appliedCoupon={appliedCoupon}
                  onCouponApply={handleCouponApply}
                  isAuthenticated={isAuthenticated}
                  walletApplied={walletApplied}
                />
              </div>
            </motion.div>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-semibold mb-6">Payment Method</h2>

                  {canUseWallet && (
                    <div 
                      onClick={() => setUseWallet(!useWallet)}
                      className={`rounded-2xl border p-5 mb-6 transition-all cursor-pointer select-none ${
                        useWallet ? 'border-primary bg-primary/5' : 'border-border bg-secondary/5 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-3 transition-colors ${useWallet ? 'bg-primary/20' : 'bg-secondary/70'}`}>
                            <Wallet className="h-5 w-5 text-foreground" />
                          </div>
                          <div>
                            <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
                              Wallet Balance Available
                            </p>
                            <p className="text-lg font-bold">
                              {formatPrice(maxWalletPossible)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            useWallet ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {useWallet && <Check size={12} className="text-primary-foreground" />}
                          </div>
                          <span className="text-sm font-medium">{useWallet ? 'Applied' : 'Use Wallet'}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground border-t border-border/50 pt-3">
                        {useWallet 
                          ? `₹${maxWalletPossible} will be deducted from your wallet. Remaining payment will use the selected method.` 
                          : 'Click to apply your wallet balance to this order.'}
                      </p>
                    </div>
                  )}

                  {/* Payment Methods */}
                  <div className="space-y-4 mb-8">
                    {[
                      { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Rupay' },
                      { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
                      { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive' },
                    ].map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id as typeof paymentMethod)}
                          className="w-4 h-4 text-primary"
                        />
                        <div>
                          <p className="font-medium">{method.label}</p>
                          <p className="text-sm text-muted-foreground">{method.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Card Details */}
                  {paymentMethod === 'card' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-5 mb-6"
                    >
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Number</label>
                        <input
                          type="text"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                          className="input-premium"
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Name on Card</label>
                        <input
                          type="text"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                          className="input-premium"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium mb-2">Expiry Date</label>
                          <input
                            type="text"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                            className="input-premium"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">CVV</label>
                          <input
                            type="password"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                            className="input-premium"
                            placeholder="•••"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === 'upi' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6"
                    >
                      <label className="block text-sm font-medium mb-2">UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="input-premium"
                        placeholder="yourname@upi"
                      />
                    </motion.div>
                  )}

                  <form onSubmit={handlePaymentSubmit}>
                    <button 
                      type="submit" 
                      disabled={isProcessing}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Shield size={18} />
                          Pay {formatPrice(remainingTotal)}
                          {walletApplied > 0 && remainingTotal > 0 ? (
                            <span className="ml-2 text-sm font-medium text-muted-foreground">
                              (+ {formatPrice(walletApplied)} wallet)
                            </span>
                          ) : null}
                        </>
                      )}
                    </button>
                  </form>

                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Shield size={14} />
                    <span>Your payment information is secure</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <OrderSummary 
                  items={items} 
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

          {/* Confirmation Step */}
          {currentStep === 'confirmation' && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </motion.div>

              <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Thank you for your purchase
              </p>

              <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono font-medium">{confirmedOrder?.id || orderId}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">{formatPrice(confirmedOrder?.total || 0)}</span>
                </div>
                {confirmedOrder?.discount ? (
                  <div className="flex items-center justify-between mb-4 text-green-600">
                    <span>Discount Applied ({confirmedOrder.couponCode})</span>
                    <span>-{formatPrice(confirmedOrder.discount)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estimated Delivery</span>
                  <span className="font-medium">5-7 Business Days</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold mb-3">What's Next?</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• You'll receive an order confirmation email shortly</p>
                  <p>• We'll notify you when your order ships</p>
                  <p>• Track your order in your profile</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/shop" className="btn-primary">
                  Continue Shopping
                </Link>
                <Link to="/profile" className="btn-outline">
                  View Orders
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

// Order Summary Component
interface OrderSummaryProps {
  items: CheckoutCartItem[];
  totalPrice: number;
  tax: number;
  grandTotal: number;
  couponDiscount?: number;
  appliedCoupon?: CouponData | null;
  onCouponApply?: (discount: number, couponData: CouponData | null) => void;
  isAuthenticated?: boolean;
  walletApplied?: number;
}

const OrderSummary = ({ 
  items, 
  totalPrice, 
  tax, 
  grandTotal, 
  couponDiscount = 0,
  appliedCoupon,
  onCouponApply,
  isAuthenticated = false,
  walletApplied = 0
}: OrderSummaryProps) => (
  <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
    <h3 className="font-semibold mb-4">Order Summary</h3>
    
    <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-hide mb-4">
      {items.map((item) => (
        <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-3">
          <img 
            src={getProductImage(item.product, item.color)} 
            alt={item.product.name}
            className="w-16 h-20 object-cover rounded-lg"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
            <p className="text-xs text-muted-foreground">{item.size} • {item.color}</p>
            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
            <p className="font-medium text-sm">{formatPrice(item.product.price * item.quantity)}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Coupon Input */}
    {onCouponApply && (
      <div className="border-t border-border pt-4 mb-4">
        <CouponInput 
          subtotal={totalPrice} 
          onApplyCoupon={onCouponApply}
          isAuthenticated={isAuthenticated}
        />
      </div>
    )}

    <div className="border-t border-border pt-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>
      
      {couponDiscount > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex justify-between text-sm text-green-600"
        >
          <span>Discount {appliedCoupon && `(${appliedCoupon.code})`}</span>
          <span>-{formatPrice(couponDiscount)}</span>
        </motion.div>
      )}
      
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Shipping</span>
        <span className="text-green-600">Free</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Tax (GST 18%)</span>
        <span>{formatPrice(tax)}</span>
      </div>
      
      {walletApplied > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex justify-between text-sm text-primary font-medium border-t border-border/50 pt-2"
        >
          <span>Wallet Applied</span>
          <span>-{formatPrice(walletApplied)}</span>
        </motion.div>
      )}

      <motion.div 
        key={grandTotal - walletApplied}
        initial={{ scale: 1.02, color: 'hsl(var(--primary))' }}
        animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
        transition={{ duration: 0.3 }}
        className="flex justify-between font-semibold text-lg pt-2 border-t border-border"
      >
        <span>Total Payable</span>
        <span>{formatPrice(Math.max(grandTotal - walletApplied, 0))}</span>
      </motion.div>
    </div>

    <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
      <Truck size={14} />
      <span>Free delivery on all orders</span>
    </div>
  </div>
);

export default Checkout;
