import React from 'react';
import { Heart } from 'lucide-react';
import { Language, Product } from '../types';
import { t } from '../i18n/translations';
import { ProductCard } from './ProductCard';

interface WishlistViewProps {
  lang: Language;
  products: Product[];
  wishlistIds: string[];
  isSignedIn: boolean;
  whatsappNumber: string;
  onSignIn: () => Promise<void>;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onBrowseShop: () => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  lang,
  products,
  wishlistIds,
  isSignedIn,
  whatsappNumber,
  onSignIn,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  onBrowseShop,
}) => {
  const copy = t(lang);
  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  if (!isSignedIn) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Heart className="w-10 h-10 text-[#1E3A5F] mx-auto mb-3" />
        <h2 className="font-display text-2xl font-semibold text-[#1C1B19]">
          {copy.wishlistTitle}
        </h2>
        <p className="mt-2 text-sm text-[#66615B] max-w-md mx-auto">
          {copy.signInToWishlist}
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-6 rounded-lg bg-[#1E3A5F] px-6 py-3 text-sm font-medium text-white hover:bg-[#162C49] cursor-pointer min-h-[44px]"
        >
          {copy.signInGoogle}
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12 space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1B19]">
          {copy.wishlistTitle}
        </h1>
        <span className="text-xs text-[#66615B] tabular-nums">
          {savedProducts.length} {savedProducts.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {savedProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E1D8] p-12 text-center space-y-4">
          <Heart className="w-10 h-10 text-[#E5E1D8] mx-auto" />
          <p className="text-sm text-[#66615B]">{copy.emptyWishlist}</p>
          <button
            type="button"
            onClick={onBrowseShop}
            className="rounded-lg bg-[#1E3A5F] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#162C49] cursor-pointer min-h-[44px]"
          >
            {copy.continueShopping}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              lang={lang}
              isWishlisted={true}
              whatsappNumber={whatsappNumber}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </section>
  );
};
