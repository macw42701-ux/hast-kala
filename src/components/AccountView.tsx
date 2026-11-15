import React, { useEffect, useState } from 'react';
import { Check, Globe, LogOut } from 'lucide-react';
import { Language, UserProfile } from '../types';
import { t } from '../i18n/translations';
import { PWAInstallButton } from './PWAInstallButton';

interface AccountViewProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  userEmail: string | null;
  isSignedIn: boolean;
  userProfile: UserProfile | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSaveProfile: (data: {
    name: string;
    phone: string;
    email: string;
    address: string;
    language: Language;
  }) => Promise<void>;
}

export const AccountView: React.FC<AccountViewProps> = ({
  lang,
  onChangeLang,
  userEmail,
  isSignedIn,
  userProfile,
  onSignIn,
  onSignOut,
  onSaveProfile,
}) => {
  const copy = t(lang);
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [email, setEmail] = useState(userProfile?.email || userEmail || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(userProfile?.name || '');
    setPhone(userProfile?.phone || '');
    setEmail(userProfile?.email || userEmail || '');
    setAddress(userProfile?.address || '');
  }, [userProfile, userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await onSaveProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        language: lang,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1B19]">
          {copy.profileTitle}
        </h1>
        <PWAInstallButton lang={lang} />
      </div>

      {/* Language Selection Card */}
      <div className="bg-white rounded-xl border border-[#E5E1D8] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-[#1E3A5F]" />
          <div>
            <p className="text-sm font-semibold text-[#1C1B19]">{copy.languagePref}</p>
            <p className="text-xs text-[#66615B]">English & ગુજરાતી</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 p-1 bg-[#F1EFEA] rounded-lg">
          <button
            type="button"
            onClick={() => onChangeLang('en')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              lang === 'en' ? 'bg-white text-[#1C1B19] shadow-sm' : 'text-[#66615B]'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onChangeLang('gu')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              lang === 'gu' ? 'bg-white text-[#1C1B19] shadow-sm' : 'text-[#66615B]'
            }`}
          >
            ગુજરાતી
          </button>
        </div>
      </div>

      {!isSignedIn ? (
        <div className="bg-white rounded-xl border border-[#E5E1D8] p-6 sm:p-8 text-center space-y-4">
          <img
            src="/assets/aistudio/Three_Angels_Hast_Kala_Logo_104c951d.png"
            alt={copy.brand}
            referrerPolicy="no-referrer"
            className="h-24 w-auto mx-auto object-contain"
          />
          <p className="text-sm text-[#4A4640] max-w-md mx-auto">{copy.signInToTrack}</p>
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center justify-center rounded-lg bg-[#1E3A5F] px-6 py-3 text-sm font-medium text-white hover:bg-[#162C49] cursor-pointer min-h-[44px]"
          >
            {copy.signInGoogle}
          </button>
          <p className="text-xs text-[#66615B] pt-2">{copy.phoneAuthNote}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E5E1D8] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F1EFEA]">
            <div>
              <p className="text-sm font-semibold text-[#1C1B19]">{userEmail}</p>
              <p className="text-xs text-[#66615B]">Customer Account</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E1D8] px-3.5 py-2 text-xs font-medium text-[#1C1B19] hover:bg-[#F1EFEA] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{copy.signOut}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#66615B] mb-1">
                {copy.fullName}
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2.5 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1E3A5F]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#66615B] mb-1">
                {copy.mobileNumber}
              </label>
              <input
                type="tel"
                maxLength={20}
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2.5 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1E3A5F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#66615B] mb-1">
              {copy.emailLabel}
            </label>
            <input
              type="email"
              maxLength={160}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2.5 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1E3A5F]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#66615B] mb-1">
              {copy.deliveryAddress}
            </label>
            <textarea
              rows={3}
              maxLength={400}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2.5 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1E3A5F]"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {saved && (
            <p className="text-xs text-emerald-700 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {copy.profileSaved}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#1E3A5F] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#162C49] disabled:opacity-50 cursor-pointer min-h-[44px]"
          >
            {saving ? '...' : copy.saveProfile}
          </button>
        </form>
      )}
    </section>
  );
};
