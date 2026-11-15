import React, { useState } from 'react';
import { Heart, MessageCircle, Plus, Star } from 'lucide-react';
import { Language, Product } from '../types';
import { t } from '../i18n/translations';
import { buildProductWhatsappUrl } from '../lib/whatsapp';

interface ProductCardProps {
  product: Product;
  lang: Language;
  isWishlisted: boolean;
  whatsappNumber: string;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  lang,
  isWishlisted,
  whatsappNumber,
  onSelect,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [imgError, setImgError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const copy = t(lang);
  const name = lang === 'gu' ? product.nameGu : product.nameEn;
  const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const whatsappUrl = buildProductWhatsappUrl(whatsappNumber, product, 1, lang);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  };

  return (
    <article
      onClick={() => onSelect(product)}
      className="group bg-white rounded-xl border border-[#E5E1D8] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col"
    >
      <div className="relative aspect-[4/3] w-full bg-[#F1EFEA] overflow-hidden">
        {!imgError && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#F1EFEA] to-[#E5E1D8]">
            <span className="font-display text-lg text-[#1C1B19]">{name}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? copy.savedInWishlist : copy.saveToWishlist}
          className="absolute top-3 right-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-[#E5E1D8] text-[#1C1B19] hover:bg-white transition-colors cursor-pointer shadow-xs"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-[#9F1239] text-[#9F1239]' : 'text-[#66615B]'
            }`}
          />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-[#66615B]">
            <span className="uppercase tracking-wider font-medium truncate">
              {copy.categories[product.category]}
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums shrink-0 text-[#1C1B19]">
              <Star className="w-3.5 h-3.5 fill-[#9A6B2F] text-[#9A6B2F]" />
              {product.ratingAvg.toFixed(1)}
            </span>
          </div>

          <h3 className="mt-1.5 text-base font-semibold text-[#1C1B19] leading-snug line-clamp-2">
            {name}
          </h3>
        </div>

        <div className="pt-3 border-t border-[#F1EFEA] space-y-3">
          <div className="flex items-baseline justify-between gap-2 tabular-nums">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-[#1C1B19]">
                ₹{effectivePrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-xs text-[#66615B] line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-xs text-[#66615B]">
              {product.stock > 0
                ? `${product.stock} ${copy.onlyLeft}`
                : copy.outOfStock}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={handleQuickAdd}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1E3A5F] px-3 py-2 text-xs font-medium text-white hover:bg-[#162C49] disabled:bg-[#E5E1D8] disabled:text-[#66615B] transition-colors whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{justAdded ? copy.addedToCart : copy.addToCart}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-disabled={product.stock <= 0}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#1E3A5F]/25 bg-white px-3 py-2 text-xs font-medium text-[#1E3A5F] hover:bg-[#F1EFEA] transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                product.stock <= 0 ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{copy.orderOnWhatsapp}</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
};
