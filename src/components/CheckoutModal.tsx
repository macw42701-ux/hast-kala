import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, X } from 'lucide-react';
import { CartItem, Language, Order, UserProfile } from '../types';
import { t } from '../i18n/translations';

interface CheckoutModalProps {
  open: boolean;
  lang: Language;
  items: CartItem[];
  freeShippingThreshold: number;
  whatsappNumber: string;
  userProfile: UserProfile | null;
  isSignedIn: boolean;
  onSignIn: () => Promise<void>;
  onClose: () => void;
  onPlaceOrder: (details: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
  }) => Promise<Order>;
  onViewOrders: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  lang,
  items,
  freeShippingThreshold,
  whatsappNumber,
  userProfile,
  isSignedIn,
  onSignIn,
  onClose,
  onPlaceOrder,
  onViewOrders,
}) => {
  const copy = t(lang);
  const [customerName, setCustomerName] = useState(userProfile?.name || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(userProfile?.address || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  if (!open) return null;

  const subtotal = items.reduce((sum, item) => {
    const unit = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
    return sum + unit * item.quantity;
  }, 0);
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : 120;
  const totalAmount = subtotal + shippingFee;

  const buildWhatsappUrl = (order: Order) => {
    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
    const itemLines = order.items
      .map((i) => `• ${i.nameEn} x${i.quantity} (₹${(i.price * i.quantity).toLocaleString('en-IN')})`)
      .join('\n');
    const message = [
      `Namaste Hast Kala!`,
      `New Order Placed: *${order.orderCode}*`,
      ``,
      `*Items:*`,
      itemLines,
      ``,
      `*Total Amount:* ₹${order.totalAmount.toLocaleString('en-IN')}`,
      `*Customer:* ${order.customerName}`,
      `*Phone:* ${order.customerPhone}`,
      `*Delivery Address:* ${order.deliveryAddress}`,
    ].join('\n');

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || customerPhone.trim().length < 8 || deliveryAddress.trim().length < 5) {
      setError('Please enter your full name, valid mobile number, and complete delivery address.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const created = await onPlaceOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
      });
      setPlacedOrder(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm md:p-6">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-2xl border border-[#E5E1D8] shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E1D8]">
          <h2 className="font-display text-xl font-semibold text-[#1C1B19]">
            {placedOrder ? copy.orderConfirmedTitle : copy.checkoutTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="p-2 text-[#66615B] hover:text-[#1C1B19] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {placedOrder ? (
          <div className="py-6 space-y-5 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
            <div>
              <p className="text-xs uppercase tracking-wider text-[#66615B]">{copy.orderIdLabel}</p>
              <p className="mt-1 text-2xl font-bold text-[#1C1B19] tabular-nums">
                {placedOrder.orderCode}
              </p>
            </div>
            <p className="text-sm text-[#4A4640] leading-relaxed">{copy.whatsappHint}</p>

            <a
              href={buildWhatsappUrl(placedOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] px-5 py-3.5 text-sm font-medium text-white hover:bg-[#162C49] transition-colors min-h-[48px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{copy.sendWhatsapp}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onClose();
                onViewOrders();
              }}
              className="w-full rounded-lg border border-[#E5E1D8] py-3 text-sm font-medium text-[#1C1B19] hover:bg-[#F1EFEA] transition-colors cursor-pointer min-h-[44px]"
            >
              {copy.trackThisOrder}
            </button>
          </div>
        ) : !isSignedIn ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-[#4A4640]">{copy.signInToTrack}</p>
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center justify-center rounded-lg bg-[#1E3A5F] px-6 py-3 text-sm font-medium text-white hover:bg-[#162C49] cursor-pointer min-h-[44px]"
            >
              {copy.signInGoogle}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-5 space-y-4">
            <p className="text-xs text-[#66615B] bg-[#F9F8F6] p-3.5 rounded-lg border border-[#E5E1D8] leading-relaxed">
              {copy.paymentNotice}
            </p>

            <div>
              <label className="block text-xs font-medium text-[#66615B] mb-1">
                {copy.fullName}
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2.5 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1E3A5F]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#66615B] mb-1">
                {copy.mobileNumber}
              </label>
              <input
                type="tel"
                required
                maxLength={20}
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2.5 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1E3A5F]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#66615B] mb-1">
                {copy.deliveryAddress}
              </label>
              <textarea
                required
                rows={3}
                maxLength={400}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2.5 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1E3A5F]"
              />
            </div>

            <div className="bg-[#F9F8F6] rounded-lg p-4 border border-[#E5E1D8] space-y-2 text-sm tabular-nums">
              <div className="flex justify-between text-[#66615B]">
                <span>{copy.subtotal} ({items.length})</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#66615B]">
                <span>{copy.deliveryFee}</span>
                <span>{shippingFee === 0 ? copy.freeDelivery : `₹${shippingFee}`}</span>
              </div>
              <div className="pt-2 border-t border-[#E5E1D8] flex justify-between font-semibold text-[#1C1B19]">
                <span>{copy.estimatedTotal}</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#1E3A5F] py-3.5 text-sm font-medium text-white hover:bg-[#162C49] disabled:opacity-50 transition-colors cursor-pointer min-h-[48px]"
            >
              {submitting ? '...' : copy.confirmOrder}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
