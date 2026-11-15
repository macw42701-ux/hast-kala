import React from 'react';
import { ArrowLeft, Lock, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Language, Order, OrderStatus, Product, Review, StoreSettings, UserProfile } from '../types';
import { AdminDashboard } from './AdminDashboard';

interface AdminPageProps {
  lang: Language;
  isSignedIn: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  products: Product[];
  orders: Order[];
  customers: UserProfile[];
  reviews: Review[];
  settings: StoreSettings;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onBackToStore: () => void;
  onSeedCatalog: () => Promise<void>;
  onSaveProduct: (product: Omit<Product, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateOrder: (
    order: Order,
    nextStatus: OrderStatus,
    adminRemarks: string,
    estimatedDelivery: string,
  ) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onClearOrders: () => Promise<void>;
  onToggleReviewApproval: (review: Review) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onSaveSettings: (settings: Omit<StoreSettings, 'updatedAt'>) => Promise<void>;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  lang,
  isSignedIn,
  isAdmin,
  userEmail,
  products,
  orders,
  customers,
  reviews,
  settings,
  onSignIn,
  onSignOut,
  onBackToStore,
  onSeedCatalog,
  onSaveProduct,
  onDeleteProduct,
  onUpdateOrder,
  onDeleteOrder,
  onClearOrders,
  onToggleReviewApproval,
  onDeleteReview,
  onSaveSettings,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6] text-[#1C1B19]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E1D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src="/assets/aistudio/Three_Angels_Hast_Kala_Logo_104c951d.png"
              alt="Three Angels Hast Kala"
              referrerPolicy="no-referrer"
              className="h-11 w-auto object-contain shrink-0"
            />
            <span className="hidden sm:inline text-xs font-medium uppercase tracking-wider text-[#66615B] border-l border-[#E5E1D8] pl-4">
              Administrator Portal
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E1D8] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1B19] hover:bg-[#F1EFEA] transition-colors cursor-pointer min-h-[40px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </button>

            {isSignedIn && (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A5F] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#162C49] transition-colors cursor-pointer min-h-[40px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {!isSignedIn ? (
          <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
            <div className="bg-white rounded-2xl border border-[#E5E1D8] p-8 text-center space-y-5 shadow-xs">
              <img
                src="/assets/aistudio/Three_Angels_Hast_Kala_Logo_104c951d.png"
                alt="Three Angels Hast Kala"
                referrerPolicy="no-referrer"
                className="h-24 w-auto mx-auto object-contain"
              />
              <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#1E3A5F]">
                <Lock className="w-3.5 h-3.5" />
                <span>Restricted Access</span>
              </div>
              <h1 className="font-display text-2xl font-semibold text-[#1C1B19]">
                Administrator Login
              </h1>
              <p className="text-sm text-[#66615B] leading-relaxed">
                Sign in with an authorized administrator account to update product details, adjust price tags, upload product photos, and manage customer orders.
              </p>

              <button
                type="button"
                onClick={onSignIn}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] px-6 py-3 text-sm font-medium text-white hover:bg-[#162C49] transition-colors cursor-pointer min-h-[48px]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign in with Administrator Google Account</span>
              </button>
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
            <div className="bg-white rounded-2xl border border-[#E5E1D8] p-8 text-center space-y-4">
              <ShieldAlert className="w-10 h-10 text-amber-700 mx-auto" />
              <h1 className="font-display text-2xl font-semibold text-[#1C1B19]">
                Unauthorized Account
              </h1>
              <p className="text-sm text-[#66615B] leading-relaxed">
                You are currently signed in as <strong className="text-[#1C1B19]">{userEmail}</strong>, which does not have administrator permissions.
              </p>
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    await onSignOut();
                    await onSignIn();
                  }}
                  className="w-full rounded-lg bg-[#1E3A5F] py-3 text-sm font-medium text-white hover:bg-[#162C49] cursor-pointer min-h-[44px]"
                >
                  Switch to Administrator Account
                </button>
                <button
                  type="button"
                  onClick={onBackToStore}
                  className="w-full rounded-lg border border-[#E5E1D8] py-3 text-sm font-medium text-[#1C1B19] hover:bg-[#F1EFEA] cursor-pointer min-h-[44px]"
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          </div>
        ) : (
          <AdminDashboard
            lang={lang}
            products={products}
            orders={orders}
            customers={customers}
            reviews={reviews}
            settings={settings}
            onSeedCatalog={onSeedCatalog}
            onSaveProduct={onSaveProduct}
            onDeleteProduct={onDeleteProduct}
            onUpdateOrder={onUpdateOrder}
            onDeleteOrder={onDeleteOrder}
            onClearOrders={onClearOrders}
            onToggleReviewApproval={onToggleReviewApproval}
            onDeleteReview={onDeleteReview}
            onSaveSettings={onSaveSettings}
          />
        )}
      </main>
    </div>
  );
};
