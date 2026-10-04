import React, { useState } from 'react';
import { UserRole, Language, RecordEntry } from '../types';
import { DataService } from '../services/dataService';
import { ExtentService } from '../services/extentService';
import { CryptoAuditService } from '../services/cryptoAuditService';
import { i18n } from '../services/i18n';
import { 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Check,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface DoubleEntryViewProps {
  role: UserRole;
  lang: Language;
}

export const DoubleEntryView: React.FC<DoubleEntryViewProps> = ({ role, lang }) => {
  const t = i18n[lang];
  const pendingEntries = DataService.getPendingDoubleEntries();
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const currentItem = pendingEntries[selectedEntryIndex] || pendingEntries[0];

  // Active Entrant entry form state
  const [activeEntrant, setActiveEntrant] = useState<'A' | 'B'>('A');
  const [surveyNumber, setSurveyNumber] = useState(currentItem?.entrantA?.survey_number || '45');
  const [hissa, setHissa] = useState(currentItem?.entrantA?.hissa || '1');
  const [tenure, setTenure] = useState(currentItem?.entrantA?.tenure || 'ಖಾಸ್ ದರಖಾಸ್ತು');
  const [acres, setAcres] = useState<number>(currentItem?.entrantA?.acres || 3);
  const [guntas, setGuntas] = useState<number>(currentItem?.entrantA?.guntas || 0);
  const [anas, setAnas] = useState<number>(currentItem?.entrantA?.anas || 0);
  const [mutationRef, setMutationRef] = useState(currentItem?.entrantA?.mutation_reference || '');
  const [ownerName, setOwnerName] = useState(currentItem?.entrantA?.owner_name || 'ತಿಮ್ಮಯ್ಯ ಬಿನ್ ರಾಮಯ್ಯ');

  // Verifier resolution modal
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolvedField, setResolvedField] = useState('guntas');
  const [resolvedValue, setResolvedValue] = useState('0');
  const [resolutionReason, setResolutionReason] = useState('Pahani Column 3 shows exactly 3A-0G-0A. 2 guntas was a transcription typo.');
  const [resolutionSuccess, setResolutionSuccess] = useState(false);

  // Document scan viewer zoom state
  const [zoomLevel, setZoomLevel] = useState(1);

  // Live Extent Calculation
  const totalAnas = ExtentService.toAnas(Number(acres) || 0, Number(guntas) || 0, Number(anas) || 0);
  const formattedExtent = ExtentService.format(totalAnas);

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionReason || resolutionReason.trim().length < 5) {
      alert('A valid justification must be recorded for verifier audit.');
      return;
    }

    DataService.resolveDiscrepancy(
      currentItem.parcelId,
      resolvedField,
      resolvedValue,
      resolutionReason,
      role === 'verifier' ? 'verifier_sumana' : 'admin_lead',
      role === 'verifier' ? 'Sumana Rao (Senior Verifier)' : 'Technical Admin'
    );

    setResolutionSuccess(true);
    setTimeout(() => {
      setResolutionSuccess(false);
      setShowResolutionModal(false);
    }, 1500);
  };

  const entrantA = currentItem?.entrantA;
  const entrantB = currentItem?.entrantB;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>{t.double_entry.title}</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            {lang === 'kn' ? 'ಸರ್ವೆ ನಂಬರ್ 45/1 ರ ಪಹಣಿ ಪರಿಶೀಲನೆ' : 'Double-Entry Verification for Survey 45/1'}
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
            {t.double_entry.instruction}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {currentItem?.status === 'DISCREPANCY_DETECTED' ? (
            <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              {lang === 'kn' ? 'ವ್ಯತ್ಯಾಸ ಪತ್ತೆಯಾಗಿದೆ - ಪರಿಶೀಲಕರ ತೀರ್ಮಾನ ಬಾಕಿ' : 'Discrepancy Detected - Verifier Required'}
            </span>
          ) : currentItem?.status === 'CONFIRMED' ? (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              {lang === 'kn' ? 'ದಾಖಲೆ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ' : 'Record Confirmed & Synced'}
            </span>
          ) : (
            <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-full text-xs font-bold">
              Needs Entrant B
            </span>
          )}
        </div>
      </div>

      {/* Side-by-Side Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Document Viewer (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-800" />
              <h3 className="font-bold text-stone-900 text-sm">
                {lang === 'kn' ? 'ಮೂಲ ಪಹಣಿ ಸ್ಕ್ಯಾನ್ ಪ್ರತಿ (Source Document View)' : 'Original Pahani Document Scan'}
              </h3>
            </div>
            {/* Viewer Controls */}
            <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-0.5 border border-stone-200 text-xs">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.0))}
                className="p-1 hover:bg-white rounded cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5 text-stone-700" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
                className="p-1 hover:bg-white rounded cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5 text-stone-700" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:bg-white rounded cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-700" />
              </button>
            </div>
          </div>

          {/* Document Viewer Frame */}
          <div className="relative mt-3 flex-1 min-h-[380px] bg-stone-900 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-stone-300">
            <div 
              className="transition-transform duration-200 select-none origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Simulated Karnataka RTC Pahani Document Sheet */}
              <div className="w-[380px] bg-amber-50/90 text-stone-900 p-5 rounded shadow-lg font-mono text-[11px] leading-relaxed border-2 border-amber-200 space-y-3">
                <div className="text-center font-bold border-b border-stone-400 pb-2">
                  ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಕಂದಾಯ ಇಲಾಖೆ<br />
                  <span className="text-[12px]">ಭೂಮಿ ಪಹಣಿ (RTC - Form No. 16)</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] border-b border-stone-300 pb-2">
                  <div>ಗ್ರಾಮ: ಕಲ್ಲೂರು (Kallur)</div>
                  <div>ತಾಲೂಕು: ಗುಬ್ಬಿ (Gubbi)</div>
                  <div>ಸರ್ವೆ ನಂ: <strong>45/1</strong></div>
                  <div>ವರ್ಷ: 2024-25</div>
                </div>

                <div className="space-y-1.5">
                  <div className="p-1 bg-amber-100/80 rounded border border-amber-300">
                    <span className="font-bold">ಕಲಂ 3 (ವಿಸ್ತೀರ್ಣ):</span> 3 ಎಕರೆ 0 ಗುಂಟೆ 0 ಆಣೆ (3A-0G-0A)
                  </div>
                  <div className="p-1 bg-amber-100/80 rounded border border-amber-300">
                    <span className="font-bold">ಕಲಂ 9 (ಹಿಡುವಳಿ):</span> ಖಾಸ್ ದರಖಾಸ್ತು (Khas Darakht)
                  </div>
                  <div className="p-1 bg-amber-100/80 rounded border border-amber-300">
                    <span className="font-bold">ಕಲಂ 10 (ಮ್ಯುಟೇಶನ್):</span> [ಯಾವುದೇ MR ನಮೂದಿಲ್ಲ]
                  </div>
                  <div className="p-1 bg-amber-100/80 rounded border border-amber-300">
                    <span className="font-bold">ಕಲಂ 11 (ಖಾತೆದಾರ):</span> ತಿಮ್ಮಯ್ಯ ಬಿನ್ ರಾಮಯ್ಯ
                  </div>
                </div>
                <div className="text-[9px] text-stone-500 text-center pt-2 border-t border-stone-300">
                  ಡಿಜಿಟಲ್ ಸಹಿ / ಕಂದಾಯ ನಿರೀಕ್ಷಕರು
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Data Capture Form & Comparison (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col space-y-4">
          {/* Entrant Comparison Matrix */}
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs">
            <h4 className="font-bold text-stone-800 mb-2 flex items-center justify-between">
              <span>{lang === 'kn' ? 'ಸ್ವಯಂಸೇವಕರ ನಮೂದು ಹೋಲಿಕೆ (Double-Entry Match)' : 'Two-Entrant Match Matrix'}</span>
              {(role === 'verifier' || role === 'admin') && currentItem?.status === 'DISCREPANCY_DETECTED' && (
                <button
                  onClick={() => setShowResolutionModal(true)}
                  className="px-2.5 py-1 bg-stone-900 text-white rounded font-semibold hover:bg-stone-800 cursor-pointer"
                >
                  {lang === 'kn' ? 'ತೀರ್ಮಾನ ಕೈಗೊಳ್ಳಿ' : 'Resolve Discrepancy'} &rarr;
                </button>
              )}
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 text-[10px]">
                    <th className="py-1">Field</th>
                    <th className="py-1">Entrant A (Ramesh)</th>
                    <th className="py-1">Entrant B (Priya)</th>
                    <th className="py-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="py-1.5 font-medium">Survey/Hissa</td>
                    <td>{entrantA?.survey_number}/{entrantA?.hissa}</td>
                    <td>{entrantB?.survey_number}/{entrantB?.hissa}</td>
                    <td className="text-right text-emerald-700 font-bold">Match</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-medium">Tenure</td>
                    <td>{entrantA?.tenure}</td>
                    <td>{entrantB?.tenure}</td>
                    <td className="text-right text-emerald-700 font-bold">Match</td>
                  </tr>
                  <tr className="bg-amber-100/50">
                    <td className="py-1.5 font-medium">Gross Extent</td>
                    <td className="font-bold text-stone-900">{entrantA?.acres}A-{entrantA?.guntas}G-{entrantA?.anas}A</td>
                    <td className="font-bold text-rose-800">{entrantB?.acres}A-{entrantB?.guntas}G-{entrantB?.anas}A</td>
                    <td className="text-right text-rose-700 font-bold">DISAGREE</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-medium">Mutation Ref</td>
                    <td>{entrantA?.mutation_reference || 'None'}</td>
                    <td>{entrantB?.mutation_reference || 'None'}</td>
                    <td className="text-right text-emerald-700 font-bold">Match</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Fields Defined by record_format.yaml */}
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">ಸರ್ವೆ ನಂಬರ್ *</label>
                <input
                  type="text"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-stone-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">ಹಿಸ್ಸಾ *</label>
                <input
                  type="text"
                  value={hissa}
                  onChange={(e) => setHissa(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-stone-50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">ಹಿಡುವಳಿ ವಿವರ / ನಮೂನೆ *</label>
              <input
                type="text"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-stone-50 focus:outline-none"
              />
            </div>

            {/* Extent Input with Live Conversion Preview */}
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-2">
              <label className="font-bold text-emerald-950 block">
                {lang === 'kn' ? 'ಒಟ್ಟು ವಿಸ್ತೀರ್ಣ (ಎಕರೆ - ಗುಂಟೆ - ಆಣೆ)' : 'Gross Extent (Acres - Guntas - Anas)'} *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-stone-600 block">{t.extent.acres}</span>
                  <input
                    type="number"
                    min="0"
                    value={acres}
                    onChange={(e) => setAcres(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2 py-1.5 border border-stone-300 rounded-md bg-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-600 block">{t.extent.guntas} (0-39)</span>
                  <input
                    type="number"
                    min="0"
                    max="39"
                    value={guntas}
                    onChange={(e) => setGuntas(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2 py-1.5 border border-stone-300 rounded-md bg-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-600 block">{t.extent.anas} (0-15)</span>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={anas}
                    onChange={(e) => setAnas(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2 py-1.5 border border-stone-300 rounded-md bg-white font-bold"
                  />
                </div>
              </div>

              {/* Live Preview Display */}
              <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-emerald-200">
                <span className="text-emerald-800">
                  {lang === 'kn' ? 'ಲೈವ್ ಪರಿವರ್ತನೆ:' : 'Live Extent Preview:'} <strong>{formattedExtent}</strong>
                </span>
                <span className="text-emerald-700 text-[11px]">
                  = {totalAnas} {t.extent.anas}
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                ಮ್ಯುಟೇಶನ್ / ಪರಭಾರೆ ಆದೇಶ ಕ್ರಮಾಂಕ
              </label>
              <input
                type="text"
                value={mutationRef}
                onChange={(e) => setMutationRef(e.target.value)}
                placeholder="e.g., MR 14/1985 or leave blank if absent"
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-stone-50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Verifier Discrepancy Resolution Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-base">
                  {t.double_entry.resolve_title}
                </h3>
              </div>
              <button
                onClick={() => setShowResolutionModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {resolutionSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-stone-900 text-base">
                  {lang === 'kn' ? 'ವಿವಾದ ಯಶಸ್ವಿಯಾಗಿ ಪರಿಹರಿಸಲಾಗಿದೆ' : 'Discrepancy Resolved & Audit Logged'}
                </h4>
                <p className="text-xs text-stone-600">
                  {lang === 'kn'
                    ? 'ದಾಖಲೆಯನ್ನು ಈಗ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ನಿಯಮಗಳ ಮರು-ಲೆಕ್ಕಾಚಾರ ನಡೆಸಲಾಗಿದೆ.'
                    : 'Record confirmed with mandatory verifier justification in the audit chain.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleResolveSubmit} className="space-y-3 text-xs">
                <p className="text-stone-600 leading-relaxed">
                  {t.double_entry.resolve_instruction}
                </p>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-stone-500">Discrepant Field:</span>
                    <strong className="text-stone-800">Gross Extent (Guntas)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Entrant A entered:</span>
                    <strong className="text-stone-800">0 Guntas (3A-0G-0A)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Entrant B entered:</span>
                    <strong className="text-rose-700">2 Guntas (3A-2G-0A)</strong>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {lang === 'kn' ? 'ಖಚಿತಪಡಿಸಿದ ಸರಿಯಾದ ಮೌಲ್ಯ (Resolved Value)' : 'Resolved Value (Guntas)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="39"
                    required
                    value={resolvedValue}
                    onChange={(e) => setResolvedValue(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {lang === 'kn' ? 'ಪರಿಶೀಲಕರ ಸಮರ್ಥನೆ / ಕಾರಣ (Mandatory Justification)' : 'Verifier Justification (Logged to Audit Chain)'} *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={resolutionReason}
                    onChange={(e) => setResolutionReason(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    placeholder="Enter exact reason based on visual inspection of RTC..."
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResolutionModal(false)}
                    className="px-3 py-1.5 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-800 text-white rounded-lg font-bold hover:bg-emerald-900 cursor-pointer"
                  >
                    Confirm & Log Resolution
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
