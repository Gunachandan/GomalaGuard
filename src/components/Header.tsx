import React from 'react';
import { UserRole, Language } from '../types';
import { i18n } from '../services/i18n';
import { 
  ShieldCheck, 
  MapPin, 
  FileText, 
  ClipboardCheck, 
  Sliders, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Lock,
  Layers
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  isOnline: boolean;
  uncalibratedTolerance: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  role,
  setRole,
  lang,
  setLang,
  isOnline,
  uncalibratedTolerance,
}) => {
  const t = i18n[lang];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 shadow-xs">
      {/* Uncalibrated Tolerance Banner */}
      {uncalibratedTolerance && (
        <div className="bg-amber-500/10 border-b border-amber-300/60 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">
              {t.extent.uncalibrated_banner}
            </span>
          </div>
          <button 
            onClick={() => setCurrentTab('calibrate')}
            className="text-xs font-semibold text-amber-800 underline hover:text-amber-950 shrink-0 ml-4 cursor-pointer"
          >
            {lang === 'kn' ? 'ಕ್ಯಾಲಿಬ್ರೇಟ್ ಮಾಡಿ' : 'Calibrate Now'} &rarr;
          </button>
        </div>
      )}

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-100 flex items-center justify-center font-bold text-lg shadow-sm border border-emerald-900">
            ಗೊ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                {t.app_title}
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                v2.1 Pilot
              </span>
            </div>
            <p className="text-xs text-stone-600 hidden sm:block">
              {lang === 'kn' 
                ? 'ಕರ್ನಾಟಕ ಗ್ರಾಮ ಗೋಮಾಳ ಜಮೀನು ದಾಖಲೆಗಳ ಪರಿಶೀಲನಾ ವೇದಿಕೆ' 
                : 'Karnataka Village Pasture Land Record Triage'}
            </p>
          </div>
        </div>

        {/* System Controls: Language, Role, Network status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online/Offline indicator */}
          <div 
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title={isOnline ? 'Connected to server' : 'Working offline with local queue'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200 text-xs font-medium">
            <button
              onClick={() => setLang('kn')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                lang === 'kn'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ಕನ್ನಡ
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                lang === 'en'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              English
            </button>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg px-2 py-1 border border-stone-200">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="bg-transparent text-xs font-semibold text-stone-800 outline-none cursor-pointer pr-1"
            >
              <option value="public_visitor">{t.roles.public_visitor}</option>
              <option value="reporter">{t.roles.reporter}</option>
              <option value="entrant">{t.roles.entrant}</option>
              <option value="moderator">{t.roles.moderator}</option>
              <option value="verifier">{t.roles.verifier}</option>
              <option value="admin">{t.roles.admin}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="bg-stone-50/80 border-t border-stone-200 px-4 sm:px-6 lg:px-8">
        <nav className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 overflow-x-auto py-1.5 scrollbar-none text-xs sm:text-sm">
          <button
            onClick={() => setCurrentTab('public')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'public'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {t.nav.public_atlas}
          </button>

          <button
            onClick={() => setCurrentTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'report'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            {t.nav.report_pwa}
          </button>

          <button
            onClick={() => setCurrentTab('double-entry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'double-entry'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            {t.nav.double_entry}
          </button>

          <button
            onClick={() => setCurrentTab('reviewer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'reviewer'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            {t.nav.reviewer_console}
          </button>

          <button
            onClick={() => setCurrentTab('calibrate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'calibrate'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            {t.nav.calibrate}
          </button>

          <button
            onClick={() => setCurrentTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'audit'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t.nav.audit_log}
          </button>
        </nav>
      </div>
    </header>
  );
};
