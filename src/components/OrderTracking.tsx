import React from 'react';
import { Check, Clock, MessageSquareText, Truck, XCircle } from 'lucide-react';
import { Language, ORDER_STATUS_FLOW, Order, OrderStatus } from '../types';
import { t } from '../i18n/translations';

interface OrderTrackingProps {
  order: Order;
  lang: Language;
}

const PROGRESS_STAGES: OrderStatus[] = ORDER_STATUS_FLOW.filter((s) => s !== 'Cancelled');

export const OrderTracking: React.FC<OrderTrackingProps> = ({ order, lang }) => {
  const copy = t(lang);
  const isCancelled = order.status === 'Cancelled';
  const currentStepIdx = PROGRESS_STAGES.indexOf(order.status);
  const progressPercent = isCancelled
    ? 100
    : Math.round(((Math.max(0, currentStepIdx) + 1) / PROGRESS_STAGES.length) * 100);

  const stageTimestamps = new Map<OrderStatus, string>();
  for (const entry of order.statusHistory) {
    stageTimestamps.set(entry.status, entry.timestamp);
  }

  return (
    <div className="rounded-xl border border-[#E5E1D8] bg-[#F9F8F6] p-4 sm:p-5 space-y-5">
      {/* Header: Current Status + Progress Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#66615B]">
            {copy.orderTrackingTitle} · {ORDER_STATUS_FLOW.length}-Stage Stepper
          </p>
          <div className="mt-1 flex items-center gap-2">
            {isCancelled ? (
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <Truck className="w-4 h-4 text-[#1E3A5F] shrink-0" />
            )}
            <span className="text-sm font-semibold text-[#1C1B19]">
              {copy.currentStatusLabel}:{' '}
              <span className={isCancelled ? 'text-red-700' : 'text-[#1E3A5F]'}>
                {copy.statusLabels[order.status]}
              </span>
            </span>
          </div>
        </div>

        <div className="text-right tabular-nums">
          <span className="text-xs font-semibold text-[#1C1B19]">
            {isCancelled
              ? `${ORDER_STATUS_FLOW.length}/${ORDER_STATUS_FLOW.length}`
              : `${Math.max(1, currentStepIdx + 1)} / ${PROGRESS_STAGES.length}`}
          </span>
          {order.estimatedDelivery && !isCancelled && (
            <p className="text-[11px] text-[#66615B]">
              {copy.estDelivery}: {order.estimatedDelivery}
            </p>
          )}
        </div>
      </div>

      {/* Continuous Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[#E5E1D8] overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isCancelled ? 'bg-red-600' : 'bg-[#1E3A5F]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Clean 8-Stage Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {ORDER_STATUS_FLOW.map((stage, idx) => {
          const isCancelStage = stage === 'Cancelled';
          const isCompleted = !isCancelled && !isCancelStage && idx < currentStepIdx;
          const isCurrent = stage === order.status;
          const stageTime = stageTimestamps.get(stage);

          let cardStyles = 'border-[#E5E1D8] bg-white text-[#66615B]';
          let circleStyles = 'bg-[#F1EFEA] text-[#66615B] border-[#E5E1D8]';

          if (isCurrent && isCancelled) {
            cardStyles = 'border-red-300 bg-red-50 text-red-900';
            circleStyles = 'bg-red-600 text-white border-red-600';
          } else if (isCurrent) {
            cardStyles = 'border-[#1E3A5F] bg-white text-[#1C1B19] ring-1 ring-[#1E3A5F]/20';
            circleStyles = 'bg-[#1E3A5F] text-white border-[#1E3A5F]';
          } else if (isCompleted) {
            cardStyles = 'border-[#1E3A5F]/30 bg-white text-[#1C1B19]';
            circleStyles = 'bg-[#1E3A5F]/15 text-[#1E3A5F] border-[#1E3A5F]/30';
          } else if (isCancelStage && !isCancelled) {
            cardStyles = 'border-dashed border-[#E5E1D8] bg-white/60 text-[#66615B]/75';
          }

          return (
            <div key={stage} className={`rounded-lg border p-3 transition-colors ${cardStyles}`}>
              <div className="flex items-start gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-semibold shrink-0 tabular-nums ${circleStyles}`}
                >
                  {isCancelStage ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : isCompleted || isCurrent ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-snug truncate">
                    {copy.statusLabels[stage]}
                  </p>
                  {stageTime ? (
                    <p className="mt-0.5 text-[10px] text-[#66615B] tabular-nums">
                      {new Date(stageTime).toLocaleDateString()} ·{' '}
                      {new Date(stageTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-[#66615B]/75 inline-flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{isCancelStage ? 'If cancelled' : 'Pending'}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Administrator Notes & Status Update Log */}
      <div className="rounded-lg border border-[#E5E1D8] bg-white p-3.5 space-y-3">
        <div className="flex items-start gap-2.5">
          <MessageSquareText className="w-4 h-4 text-[#1E3A5F] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#1C1B19]">{copy.adminRemarks}</p>
            <p className="mt-0.5 text-xs text-[#4A4640] leading-relaxed">
              {order.adminRemarks ? order.adminRemarks : copy.noAdminRemarks}
            </p>
          </div>
        </div>

        {order.statusHistory.length > 0 && (
          <div className="pt-2.5 border-t border-[#F1EFEA] space-y-1.5">
            {order.statusHistory.map((entry, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-baseline justify-between gap-2 text-[11px]"
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
          </div>
        )}
      </div>
    </div>
  );
};
