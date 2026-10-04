/**
 * Gomala Atlas v2 - Root Application
 * 
 * Triage and documentation platform for village pasture land records in Karnataka.
 */

import React, { useState, useEffect } from 'react';
import { UserRole, Language } from './types';
import { Header } from './components/Header';
import { PublicAtlasView } from './components/PublicAtlasView';
import { ReporterPwaView } from './components/ReporterPwaView';
import { DoubleEntryView } from './components/DoubleEntryView';
import { ReviewerConsoleView } from './components/ReviewerConsoleView';
import { CalibrationView } from './components/CalibrationView';
import { AuditComplianceView } from './components/AuditComplianceView';
import { DataService } from './services/dataService';
import { ExtentService } from './services/extentService';
import { i18n } from './services/i18n';
import { Shield, BookOpen, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('public');
  const [role, setRole] = useState<UserRole>('public_visitor');
  const [lang, setLang] = useState<Language>('kn'); // Kannada-first as specified
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Extent tolerance configuration (defaults to uncalibrated 0, 0)
  const [tolAbs, setTolAbs] = useState<number>(ExtentService.DEFAULT_TOL_ABS_ANAS);
  const [tolRelBp, setTolRelBp] = useState<number>(ExtentService.DEFAULT_TOL_REL_BP);

  const uncalibratedTolerance = ExtentService.isToleranceUncalibrated(tolAbs, tolRelBp);

  useEffect(() => {
    DataService.initialize();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const t = i18n[lang];

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navigation & Controls */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        role={role}
        setRole={setRole}
        lang={lang}
        setLang={setLang}
        isOnline={isOnline}
        uncalibratedTolerance={uncalibratedTolerance}
      />

      {/* Main Body View */}
      <main className="flex-1 pb-12">
        {currentTab === 'public' && (
          <PublicAtlasView
            role={role}
            lang={lang}
            onOpenReport={() => setCurrentTab('report')}
            tolAbs={tolAbs}
            tolRelBp={tolRelBp}
          />
        )}

        {currentTab === 'report' && (
          <ReporterPwaView
            lang={lang}
            isOnline={isOnline}
          />
        )}

        {currentTab === 'double-entry' && (
          <DoubleEntryView
            role={role}
            lang={lang}
          />
        )}

        {currentTab === 'reviewer' && (
          <ReviewerConsoleView
            role={role}
            lang={lang}
          />
        )}

        {currentTab === 'calibrate' && (
          <CalibrationView
            lang={lang}
            tolAbs={tolAbs}
            setTolAbs={setTolAbs}
            tolRelBp={tolRelBp}
            setTolRelBp={setTolRelBp}
          />
        )}

        {currentTab === 'audit' && (
          <AuditComplianceView
            role={role}
            lang={lang}
          />
        )}
      </main>

      {/* Structural Governance & Legal Disclaimer Footer */}
      <footer className="bg-stone-900 text-stone-300 text-xs py-8 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Gomala Atlas (ಗೋಮಾಳ ಅಟ್ಲಾಸ್)</span>
                <span className="text-[10px] bg-stone-800 text-emerald-400 px-2 py-0.5 rounded font-mono">
                  v2.1 Architecture
                </span>
              </div>
              <p className="text-stone-400 text-[11px] mt-1 max-w-2xl leading-relaxed">
                {t.tagline}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-stone-400">
              <button 
                onClick={() => setCurrentTab('public')}
                className="hover:text-white cursor-pointer"
              >
                {t.nav.public_atlas}
              </button>
              <button 
                onClick={() => setCurrentTab('calibrate')}
                className="hover:text-white cursor-pointer"
              >
                Calibration
              </button>
              <button 
                onClick={() => setCurrentTab('audit')}
                className="hover:text-white cursor-pointer"
              >
                Audit Chain
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-stone-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Privacy by Structure: Database RLS &amp; Envelope Encryption enforced. Zero findings about persons.
              </span>
            </div>
            <div>
              Grievance &amp; Takedown: <code>privacy-takedown@gomala-atlas.local</code>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
