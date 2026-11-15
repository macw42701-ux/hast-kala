import React from 'react';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { CartItem, Language } from '../types';
import { t } from '../i18n/translations';

interface CartDrawerProps {
  open: boolean;
  lang: Language;
  items: CartItem[];
  freeShippingThreshold: number;
  onClose: () => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  lang,
  items,
  freeShippingThreshold,
  onClose,
  onUpdateQty,
  onRemove,
  onClearCart,
  onCheckout,
}) => {
  if (!open) return null;
  const copy = t(lang);

  const subtotal = items.reduce((sum, item) => {
    const unit = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
    return sum + unit * item.quantity;
  }, 0);

  const shippingFee = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : 120;
  const estimatedTotal = subtotal + shippingFee;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-[#E5E1D8] shadow-2xl">
        <div className="px-6 py-4 border-b border-[#E5E1D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-[#1E3A5F]" />
            <h2 className="font-display text-lg font-semibold text-[#1C1B19]">{copy.cartTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 rounded-lg text-[#66615B] hover:bg-[#F1EFEA] hover:text-[#1C1B19] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingCart className="w-10 h-10 text-[#E5E1D8] mb-3" />
              <p className="text-sm text-[#66615B]">{copy.emptyCart}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 rounded-lg border border-[#1E3A5F] px-4 py-2 text-xs font-medium text-[#1E3A5F] hover:bg-[#F1EFEA] cursor-pointer"
              >
                {copy.continueShopping}
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => {
              const name = lang === 'gu' ? product.nameGu : product.nameEn;
              const unit = product.discountPrice > 0 ? product.discountPrice : product.price;
              return (
                <div
                  key={product.id}
                  className="flex gap-4 pb-4 border-b border-[#F1EFEA] last:border-none"
                >
                  <img
                    src={product.images[0]}
                    alt={name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-lg object-cover bg-[#F1EFEA] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#1C1B19] line-clamp-2">{name}</h3>
                    <p className="text-xs text-[#66615B] mt-0.5 tabular-nums">
                      ₹{unit.toLocaleString('en-IN')} · {product.stock} {copy.onlyLeft}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-[#E5E1D8]">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, quantity - 1)}
                          className="p-1.5 text-[#1C1B19] hover:bg-[#F1EFEA] cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold tabular-nums">{quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQty(product.id, Math.min(product.stock, quantity + 1))
                          }
                          disabled={quantity >= product.stock}
                          className="p-1.5 text-[#1C1B19] hover:bg-[#F1EFEA] disabled:opacity-40 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                          aria-label="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemove(product.id)}
                        className="p-1.5 text-[#66615B] hover:text-red-600 cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-[#E5E1D8] bg-[#F9F8F6] space-y-3">
            <div className="flex justify-between text-sm text-[#66615B] tabular-nums">
              <span>{copy.subtotal}</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm text-[#66615B] tabular-nums">
              <span>{copy.deliveryFee}</span>
              <span>{shippingFee === 0 ? copy.freeDelivery : `₹${shippingFee}`}</span>
            </div>
            <div className="pt-2 border-t border-[#E5E1D8] flex justify-between text-base font-semibold text-[#1C1B19] tabular-nums">
              <span>{copy.estimatedTotal}</span>
              <span>₹{estimatedTotal.toLocaleString('en-IN')}</span>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              className="mt-2 w-full rounded-lg bg-[#1E3A5F] py-3 text-sm font-medium text-white hover:bg-[#162C49] transition-colors cursor-pointer min-h-[48px]"
            >
              {copy.proceedCheckout}
            </button>
            <button
              type="button"
              onClick={onClearCart}
              className="w-full rounded-lg border border-[#E5E1D8] bg-white py-2.5 text-xs font-medium text-[#66615B] hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer min-h-[40px]"
            >
              {copy.clearCart}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
