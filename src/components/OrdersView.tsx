import React, { useState } from 'react';
import { Check, Clock, MessageCircle, Package, Trash2, Truck, XCircle } from 'lucide-react';
import { Language, ORDER_STATUS_FLOW, Order, OrderStatus } from '../types';
import { t } from '../i18n/translations';
import { SpendingTrendsChart } from './SpendingTrendsChart';

interface OrdersViewProps {
  lang: Language;
  orders: Order[];
  whatsappNumber: string;
  isSignedIn: boolean;
  onSignIn: () => Promise<void>;
  onCancelOrder: (order: Order) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onClearOrders: () => Promise<void>;
}

const ACTIVE_STEPS: OrderStatus[] = ORDER_STATUS_FLOW.filter((s) => s !== 'Cancelled');

export const OrdersView: React.FC<OrdersViewProps> = ({
  lang,
  orders,
  whatsappNumber,
  isSignedIn,
  onSignIn,
  onCancelOrder,
  onDeleteOrder,
  onClearOrders,
}) => {
  const copy = t(lang);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const buildWhatsappUrl = (order: Order) => {
    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
    const msg = `Hello Hast Kala, checking on my order ${order.orderCode} (Status: ${order.status}).`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  if (!isSignedIn) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Package className="w-10 h-10 text-[#1E3A5F] mx-auto mb-3" />
        <h2 className="font-display text-2xl font-semibold text-[#1C1B19]">{copy.myOrdersTitle}</h2>
        <p className="mt-2 text-sm text-[#66615B] max-w-md mx-auto">{copy.signInToTrack}</p>
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
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1B19]">
          {copy.myOrdersTitle}
        </h1>
        {orders.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmClearAll ? (
              <>
                <button
                  type="button"
                  disabled={clearingAll}
                  onClick={async () => {
                    setClearingAll(true);
                    try {
                      await onClearOrders();
                      setConfirmClearAll(false);
                    } finally {
                      setClearingAll(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer min-h-[38px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{clearingAll ? '...' : copy.confirmClearOrders}</span>
                </button>
                <button
                  type="button"
                  disabled={clearingAll}
                  onClick={() => setConfirmClearAll(false)}
                  className="rounded-lg border border-[#E5E1D8] bg-white px-3 py-2 text-xs font-medium text-[#66615B] hover:text-[#1C1B19] cursor-pointer min-h-[38px]"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer min-h-[38px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{copy.clearAllOrders}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <SpendingTrendsChart orders={orders} lang={lang} />

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E1D8] p-10 text-center text-sm text-[#66615B]">
          {copy.noOrders}
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const currentStepIdx = ACTIVE_STEPS.indexOf(order.status);
            const isCancelled = order.status === 'Cancelled';

            return (
              <article
                key={order.id}
                className="bg-white rounded-xl border border-[#E5E1D8] p-5 sm:p-6 space-y-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#F1EFEA]">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#66615B]">
                      <span className="font-semibold text-[#1C1B19] tabular-nums">
                        {order.orderCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {copy.orderDate}:{' '}
                        {order.statusHistory[0]?.timestamp
                          ? new Date(order.statusHistory[0].timestamp).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-base font-semibold text-[#1C1B19] inline-flex items-center gap-2">
                      {isCancelled ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Truck className="w-4 h-4 text-[#1E3A5F]" />
                      )}
                      <span>{copy.statusLabels[order.status]}</span>
                    </p>
                  </div>

                  <div className="text-right tabular-nums">
                    <p className="text-lg font-bold text-[#1C1B19]">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </p>
                    {order.estimatedDelivery && (
                      <p className="text-xs text-[#66615B] mt-0.5">
                        {copy.estDelivery}: {order.estimatedDelivery}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.nameEn}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover bg-[#F1EFEA] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-[#1C1B19] truncate">
                            {lang === 'gu' ? item.nameGu : item.nameEn}
                          </p>
                          <p className="text-xs text-[#66615B] tabular-nums">
                            Qty {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-[#1C1B19] tabular-nums shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 8-Stage Status Progress */}
                {!isCancelled && (
                  <div className="pt-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#66615B] mb-3">
                      {copy.statusTimeline}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {ACTIVE_STEPS.map((step, idx) => {
                        const completed = idx <= currentStepIdx;
                        return (
                          <div
                            key={step}
                            className={`p-2.5 rounded-lg border text-xs ${
                              completed
                                ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1C1B19]'
                                : 'border-[#E5E1D8] text-[#66615B]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-medium">
                              {completed ? (
                                <Check className="w-3.5 h-3.5 text-[#1E3A5F] shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-[#66615B]/60 shrink-0" />
                              )}
                              <span className="truncate">{copy.statusLabels[step]}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detailed Status History Log */}
                <div className="bg-[#F9F8F6] rounded-lg p-4 border border-[#E5E1D8] space-y-2">
                  {order.statusHistory.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-baseline justify-between gap-2 text-xs"
                    >
                      <span className="font-medium text-[#1C1B19]">
                        {copy.statusLabels[entry.status]}
                        {entry.note ? ` — ${entry.note}` : ''}
                      </span>
                      <span className="text-[#66615B] tabular-nums">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {order.adminRemarks && (
                    <p className="pt-2 border-t border-[#E5E1D8] text-xs text-[#1E3A5F] font-medium">
                      {copy.adminRemarks}: {order.adminRemarks}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <a
                    href={buildWhatsappUrl(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#1E3A5F] px-4 py-2 text-xs font-medium text-[#1E3A5F] hover:bg-[#F1EFEA] min-h-[40px]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{copy.sendWhatsapp}</span>
                  </a>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.status === 'Order Received' && (
                      <button
                        type="button"
                        onClick={() => onCancelOrder(order)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer min-h-[40px]"
                      >
                        {copy.cancelOrder}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={deletingId === order.id}
                      onClick={async () => {
                        setDeletingId(order.id);
                        try {
                          await onDeleteOrder(order.id);
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E1D8] px-3.5 py-2 text-xs font-medium text-[#66615B] hover:text-red-700 hover:border-red-200 hover:bg-red-50 disabled:opacity-50 cursor-pointer min-h-[40px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{deletingId === order.id ? '...' : copy.deleteOrder}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
