import React from 'react';
import { Heart, Home, Package, ShoppingCart, Store, User } from 'lucide-react';
import { Language } from '../types';
import { t } from '../i18n/translations';

export type ActiveTab = 'shop' | 'wishlist' | 'orders' | 'account';

interface NavbarProps {
  lang: Language;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  cartCount: number;
  onOpenCart: () => void;
  bannerText?: string;
  bannerActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  activeTab,
  onSelectTab,
  cartCount,
  onOpenCart,
  bannerText,
  bannerActive,
}) => {
  const copy = t(lang);

  return (
    <>
      {bannerActive && bannerText ? (
        <div className="bg-[#1E3A5F] text-white text-center text-xs font-medium py-2 px-4 tracking-wide">
          {bannerText}
        </div>
      ) : null}

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E1D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand logo */}
          <button
            type="button"
            onClick={() => onSelectTab('shop')}
            className="flex items-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] rounded-md"
            aria-label={copy.brand}
          >
            <img
              src="/assets/aistudio/Three_Angels_Hast_Kala_Logo_104c951d.png"
              alt={copy.brand}
              referrerPolicy="no-referrer"
              className="h-11 md:h-12 w-auto object-contain"
            />
          </button>

          {/* Zone 2: 4 clean single-line customer navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#66615B]">
            <button
              type="button"
              onClick={() => onSelectTab('shop')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'shop'
                  ? 'border-[#1E3A5F] text-[#1C1B19]'
                  : 'border-transparent hover:text-[#1C1B19]'
              }`}
            >
              {copy.navShop}
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('wishlist')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'border-[#1E3A5F] text-[#1C1B19]'
                  : 'border-transparent hover:text-[#1C1B19]'
              }`}
            >
              {copy.navWishlist}
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('orders')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-[#1E3A5F] text-[#1C1B19]'
                  : 'border-transparent hover:text-[#1C1B19]'
              }`}
            >
              {copy.navTrack}
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('account')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'account'
                  ? 'border-[#1E3A5F] text-[#1C1B19]'
                  : 'border-transparent hover:text-[#1C1B19]'
              }`}
            >
              {copy.navAccount}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-2 text-xs font-medium text-white hover:bg-[#162C49] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{copy.bag}</span>
              <span className="tabular-nums font-semibold">({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Thumb Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E1D8] pb-safe"
      >
        <div className="grid grid-cols-4 h-16 items-center">
          <button
            type="button"
            onClick={() => onSelectTab('shop')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'shop' ? 'text-[#1E3A5F]' : 'text-[#66615B]'
            }`}
          >
            {activeTab === 'shop' ? <Store className="w-5 h-5" /> : <Home className="w-5 h-5" />}
            <span className="text-[10px] font-medium mt-0.5 tracking-tight">{copy.navShop}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('wishlist')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'wishlist' ? 'text-[#1E3A5F]' : 'text-[#66615B]'
            }`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'wishlist' ? 'fill-[#1E3A5F]' : ''}`} />
            <span className="text-[10px] font-medium mt-0.5 tracking-tight">{copy.navWishlist}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'orders' ? 'text-[#1E3A5F]' : 'text-[#66615B]'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5 tracking-tight">{copy.navTrack}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('account')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'account' ? 'text-[#1E3A5F]' : 'text-[#66615B]'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5 tracking-tight">{copy.navAccount}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
