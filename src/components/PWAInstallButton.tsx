import React, { useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';
import { t } from '../i18n/translations';

interface PWAInstallButtonProps {
  lang: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const copy = t(lang);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg border border-[#1E3A5F]/20 bg-white px-3.5 py-2 text-xs font-medium text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{copy.installApp}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E5E1D8] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1B19] hover:border-[#1E3A5F] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{copy.installApp}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#E5E1D8]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#1C1B19]">Install Hast Kala on iOS</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-2 text-[#66615B] hover:text-[#1C1B19]"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-sm text-[#66615B] leading-relaxed">
                1. Tap the <strong>Share</strong> icon in Safari toolbar.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#1E3A5F] py-2.5 text-sm font-medium text-white hover:bg-[#162C49] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#1C1B19] px-3.5 py-2 text-xs font-medium text-white shadow-lg">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode — Viewing cached Hast Kala catalog</span>
    </div>
  );
};
