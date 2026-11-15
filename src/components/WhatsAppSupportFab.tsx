import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Language } from '../types';
import { t } from '../i18n/translations';
import { buildStoreSupportWhatsappUrl } from '../lib/whatsapp';

interface WhatsAppSupportFabProps {
  whatsappNumber: string;
  lang: Language;
}

export const WhatsAppSupportFab: React.FC<WhatsAppSupportFabProps> = ({
  whatsappNumber,
  lang,
}) => {
  const copy = t(lang);
  const href = buildStoreSupportWhatsappUrl(whatsappNumber, lang);

  if (!whatsappNumber.replace(/[^0-9]/g, '')) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={copy.whatsappSupportLabel}
      title={copy.whatsappSupportLabel}
      className="fixed right-4 bottom-20 md:bottom-6 z-40 w-14 h-14 rounded-full bg-[#128C7E] text-white shadow-lg hover:bg-[#0E7468] active:scale-95 transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
};
