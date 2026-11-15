import React, { useState } from 'react';
import { Check, Heart, MessageCircle, Minus, Plus, ShieldCheck, ShoppingCart, Star, X } from 'lucide-react';
import { Language, Order, Product, Review } from '../types';
import { t } from '../i18n/translations';
import { buildProductWhatsappUrl } from '../lib/whatsapp';

interface ProductDetailModalProps {
  product: Product;
  lang: Language;
  reviews: Review[];
  eligibleOrder: Order | null;
  isSignedIn: boolean;
  isWishlisted: boolean;
  whatsappNumber: string;
  onClose: () => void;
  onAddToCart: (product: Product, qty: number) => void;
  onBuyNow: (product: Product, qty: number) => void;
  onToggleWishlist: (productId: string) => void;
  onSubmitReview: (productId: string, orderId: string, rating: number, comment: string) => Promise<void>;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  lang,
  reviews,
  eligibleOrder,
  isSignedIn,
  isWishlisted,
  whatsappNumber,
  onClose,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  onSubmitReview,
}) => {
  const copy = t(lang);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const name = lang === 'gu' ? product.nameGu : product.nameEn;
  const description = lang === 'gu' ? product.descriptionGu : product.descriptionEn;
  const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const productReviews = reviews.filter((r) => r.productId === product.id && r.approved);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibleOrder) return;
    if (comment.trim().length < 3) {
      setReviewError('Please write at least 3 characters.');
      return;
    }
    setSubmittingReview(true);
    setReviewError('');
    try {
      await onSubmitReview(product.id, eligibleOrder.id, rating, comment.trim());
      setComment('');
      setReviewSuccess(true);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm md:p-6">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-2xl border border-[#E5E1D8] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="sticky top-4 float-right mr-4 mt-4 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 border border-[#E5E1D8] text-[#1C1B19] hover:bg-[#F1EFEA] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F1EFEA] border border-[#E5E1D8]">
              <img
                src={product.images[activeImage] || product.images[0]}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex items-center gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                      activeImage === idx ? 'border-[#1E3A5F]' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${name} view ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contiguous Purchase Module */}
          <div className="flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#66615B]">
                <span className="uppercase tracking-wider font-medium">
                  {copy.categories[product.category]}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 tabular-nums text-[#1C1B19]">
                  <Star className="w-3.5 h-3.5 fill-[#9A6B2F] text-[#9A6B2F]" />
                  {product.ratingAvg.toFixed(1)} ({productReviews.length || product.reviewCount})
                </span>
              </div>

              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#1C1B19] leading-tight">
                {name}
              </h2>

              <div className="mt-4 flex items-baseline gap-3 tabular-nums">
                <span className="text-2xl font-bold text-[#1C1B19]">
                  ₹{effectivePrice.toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-base text-[#66615B] line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-xs font-medium text-[#66615B] tabular-nums">
                {product.stock > 0
                  ? `${copy.inStock} · ${product.stock} ${copy.onlyLeft}`
                  : copy.outOfStock}
              </p>

              <p className="mt-4 text-sm text-[#4A4640] leading-relaxed">
                {description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#E5E1D8] space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-[#66615B] uppercase tracking-wider">Qty</span>
                <div className="inline-flex items-center rounded-lg border border-[#E5E1D8]">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-[#1C1B19] hover:bg-[#F1EFEA] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-semibold tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(Math.max(1, product.stock), q + 1))}
                    className="p-2.5 text-[#1C1B19] hover:bg-[#F1EFEA] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    onAddToCart(product, qty);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1E3A5F] bg-white px-4 py-3 text-sm font-medium text-[#1E3A5F] hover:bg-[#F1EFEA] disabled:opacity-40 transition-colors cursor-pointer min-h-[44px]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{copy.addToCart}</span>
                </button>
                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    onBuyNow(product, qty);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-3 text-sm font-medium text-white hover:bg-[#162C49] disabled:opacity-40 transition-colors cursor-pointer min-h-[44px]"
                >
                  <span>{copy.buyNow}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={buildProductWhatsappUrl(whatsappNumber, product, qty, lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={product.stock <= 0}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#1E3A5F]/30 bg-white px-4 py-2.5 text-xs font-medium text-[#1E3A5F] hover:bg-[#F1EFEA] transition-colors min-h-[40px] ${
                    product.stock <= 0 ? 'pointer-events-none opacity-40' : ''
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{copy.sendWhatsapp}</span>
                </a>

                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E1D8] bg-[#F9F8F6] px-4 py-2.5 text-xs font-medium text-[#1C1B19] hover:bg-[#F1EFEA] transition-colors cursor-pointer min-h-[40px]"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted ? 'fill-[#9F1239] text-[#9F1239]' : 'text-[#66615B]'
                    }`}
                  />
                  <span>{isWishlisted ? copy.savedInWishlist : copy.saveToWishlist}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="px-5 sm:px-8 pb-8 pt-6 border-t border-[#E5E1D8] bg-[#F9F8F6]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <h3 className="font-display text-lg font-semibold text-[#1C1B19]">
              {copy.reviews} ({productReviews.length})
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#66615B]">
              <ShieldCheck className="w-4 h-4 text-[#1E3A5F]" />
              {copy.reviewEligibilityNote}
            </span>
          </div>

          {isSignedIn && eligibleOrder && (
            <form onSubmit={handleReviewSubmit} className="mb-6 bg-white p-4 rounded-xl border border-[#E5E1D8] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1C1B19]">{copy.writeReview}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating ? 'fill-[#9A6B2F] text-[#9A6B2F]' : 'text-[#E5E1D8]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={600}
                placeholder={copy.reviewPlaceholder}
                className="w-full rounded-lg border border-[#E5E1D8] px-3 py-2 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1E3A5F]"
              />
              {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}
              {reviewSuccess && (
                <p className="text-xs text-emerald-700 inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Review published
                </p>
              )}
              <button
                type="submit"
                disabled={submittingReview}
                className="rounded-lg bg-[#1E3A5F] px-4 py-2 text-xs font-medium text-white hover:bg-[#162C49] disabled:opacity-50 cursor-pointer"
              >
                {submittingReview ? '...' : copy.submitReview}
              </button>
            </form>
          )}

          {productReviews.length === 0 ? (
            <p className="text-sm text-[#66615B]">{copy.noReviewsYet}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productReviews.map((review) => (
                <div key={review.id} className="bg-white p-4 rounded-xl border border-[#E5E1D8]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1C1B19]">{review.customerName}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9A6B2F] tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-[#9A6B2F]" /> {review.rating}/5
                    </span>
                  </div>
                  <p className="text-xs text-[#66615B] mt-0.5">{copy.verifiedPurchaser}</p>
                  <p className="text-sm text-[#4A4640] mt-2 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
