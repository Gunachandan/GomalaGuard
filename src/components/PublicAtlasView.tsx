import React, { useState } from 'react';
import { Village, Parcel, UserRole, Language, RuleResult } from '../types';
import { DataService } from '../services/dataService';
import { ExtentService } from '../services/extentService';
import { CryptoAuditService } from '../services/cryptoAuditService';
import { i18n } from '../services/i18n';
import { 
  Building2, 
  Search, 
  Map, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Eye, 
  EyeOff, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface PublicAtlasViewProps {
  role: UserRole;
  lang: Language;
  onOpenReport: () => void;
  tolAbs: number;
  tolRelBp: number;
}

export const PublicAtlasView: React.FC<PublicAtlasViewProps> = ({
  role,
  lang,
  onOpenReport,
  tolAbs,
  tolRelBp,
}) => {
  const t = i18n[lang];
  const [selectedVillageId, setSelectedVillageId] = useState<string>('vil-kallur');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [showTakedownModal, setShowTakedownModal] = useState(false);
  const [showRtcGuide, setShowRtcGuide] = useState(false);
  
  // Takedown form state
  const [takedownName, setTakedownName] = useState('');
  const [takedownInterest, setTakedownInterest] = useState('');
  const [takedownReason, setTakedownReason] = useState('');
  const [takedownSuccess, setTakedownSuccess] = useState(false);

  // Decryption state for verifiers
  const [decryptedName, setDecryptedName] = useState<string | null>(null);
  const [decryptJustification, setDecryptJustification] = useState('');
  const [showDecryptPrompt, setShowDecryptPrompt] = useState(false);

  const villages = DataService.getVillages();
  const currentVillage = villages.find(v => v.id === selectedVillageId) || villages[0];
  const villageParcels = DataService.getParcels(selectedVillageId);

  const filteredParcels = villageParcels.filter(p => 
    p.survey_number.includes(searchQuery) || p.current_tenure.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectParcel = (parcel: Parcel) => {
    setSelectedParcel(parcel);
    setDecryptedName(null);
    setShowDecryptPrompt(false);
  };

  const handleTakedownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!takedownName || !takedownReason) return;

    CryptoAuditService.appendAuditLog({
      actor_id: 'public_citizen',
      actor_name: takedownName,
      action: 'SUBMIT_TAKEDOWN_REQUEST',
      target_id: selectedParcel ? selectedParcel.id : currentVillage.id,
      details: `Interest: ${takedownInterest}. Grounds: ${takedownReason}`,
    });

    setTakedownSuccess(true);
    setTimeout(() => {
      setTakedownSuccess(false);
      setShowTakedownModal(false);
      setTakedownName('');
      setTakedownInterest('');
      setTakedownReason('');
    }, 2000);
  };

  const handlePerformDecryption = () => {
    if (!selectedParcel || !selectedParcel.encrypted_owner_name) return;
    try {
      const plaintext = CryptoAuditService.decryptSensitive(
        selectedParcel.encrypted_owner_name,
        role,
        role === 'admin' ? 'Administrator' : 'Senior Verifier',
        decryptJustification,
        selectedParcel.id
      );
      setDecryptedName(plaintext);
      setShowDecryptPrompt(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'CONSISTENT':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Consistent / ಹೊಂದಾಣಿಕೆ</span>;
      case 'CHANGE_OBSERVED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Change Observed / ವ್ಯತ್ಯಾಸ</span>;
      case 'CONTRADICTED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Contradicted / ದಾಖಲೆ ವಿರೋಧ</span>;
      case 'NOT_CHECKABLE':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-800 border border-stone-300">Not Checkable / ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">Not Applicable</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Village Aggregate Selector & Stats Bar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>{lang === 'kn' ? 'ಗ್ರಾಮ ಮಟ್ಟದ ಒಟ್ಟು ಸಾರಾಂಶ' : 'Village Aggregate Layer'}</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mt-1">
              {lang === 'kn' ? currentVillage.name_kn : currentVillage.name_en}
              <span className="text-sm font-normal text-stone-600 ml-2">
                ({currentVillage.taluk} Taluk, {currentVillage.district} Dist)
              </span>
            </h2>
          </div>

          {/* Village Picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-600">
              {lang === 'kn' ? 'ಗ್ರಾಮ ಆಯ್ಕೆ:' : 'Select Village:'}
            </label>
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-sm font-medium text-stone-800 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {lang === 'kn' ? v.name_kn : v.name_en} ({v.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Aggregate Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
            <span className="text-xs text-stone-600 font-medium">
              {lang === 'kn' ? 'ಒಟ್ಟು ದಾಖಲಾದ ಸರ್ವೆ ನಂ.' : 'Total Cataloged Parcels'}
            </span>
            <p className="text-xl font-bold text-stone-900 mt-0.5">{currentVillage.total_parcels}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200/60">
            <span className="text-xs text-emerald-700 font-medium">
              {lang === 'kn' ? 'ಪರಿಶೀಲಿಸಿದ ನಮೂದುಗಳು' : 'Reviewed Observations'}
            </span>
            <p className="text-xl font-bold text-emerald-900 mt-0.5">{currentVillage.reviewed_count}</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/60">
            <span className="text-xs text-amber-700 font-medium">
              {lang === 'kn' ? 'ಸಾರ್ವಜನಿಕ ವರದಿಗಳು' : 'Citizen Reports Received'}
            </span>
            <p className="text-xl font-bold text-amber-900 mt-0.5">{currentVillage.reported_count}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200/60 flex flex-col justify-between">
            <span className="text-xs text-blue-700 font-medium">
              {lang === 'kn' ? 'ಕ್ಯಾಲಿಬ್ರೇಶನ್ ಸ್ಥಿತಿ' : 'Golden Set Calibration'}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block w-fit mt-1 ${
              currentVillage.golden_set_passed ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
            }`}>
              {currentVillage.golden_set_passed ? 'Verified / ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Pending / ಬಾಕಿ'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Village Aggregate Dossier & Survey Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Village Geography & Document Truth Layer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-stone-900 text-base">
                  {lang === 'kn' ? 'ಗ್ರಾಮ ಮಟ್ಟದ ಅಧಿಕೃತ ದಾಖಲೆ ಸಾರಾಂಶ' : 'Village Geographic & Document Summary'}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                LGD Code: {currentVillage.code}
              </span>
            </div>

            {/* Strict Section 10 & Rule 3 Map Data Disclosure */}
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{lang === 'kn' ? 'ಅಧಿಕೃತ ನಕ್ಷೆ ದತ್ತಾಂಶ ನಿಯಮಾವಳಿ' : 'Official Cadastral Geometry Disclosure'}</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                {lang === 'kn'
                  ? 'ನಿಯಮ 3 ಹಾಗೂ ವಾಸ್ತುಶಿಲ್ಪ ತತ್ವ 1 ರ ಪ್ರಕಾರ: ಅಧಿಕೃತವಾಗಿ ಪರವಾನಗಿ ಪಡೆದ ಕಂದಾಯ ಸರ್ವೆ ನಕ್ಷೆಯಿಲ್ಲದೆ ಕಾಲ್ಪನಿಕ ಅಥವಾ ಅಂದಾಜು ಗಡಿ ನಕ್ಷೆಯನ್ನು ಸಾರ್ವಜನಿಕವಾಗಿ ಪ್ರದರ್ಶಿಸುವುದನ್ನು ನಿಷೇಧಿಸಲಾಗಿದೆ. ಸರ್ವೆ ಇಲಾಖೆಯಿಂದ ಪ್ರಮಾಣೀಕೃತ ಆಕಾರಬಂಧು ಆಮದು ಮಾಡುವವರೆಗೆ ಕೇವಲ ಸರ್ವೆ ಸಂಖ್ಯೆ ಮತ್ತು ವಿಸ್ತೀರ್ಣವನ್ನು ಮಾತ್ರ ದಾಖಲಿಸಲಾಗುತ್ತದೆ.'
                  : 'In strict adherence to Principle 1 (Documents over transcriptions) and Rule 3 (No scraping): Speculative or synthetic parcel polygon boundaries are not displayed. Parcel boundaries will only be mapped after certified Survey Department settlement shapefiles are imported and licensed.'}
              </p>
            </div>

            {/* Village Extent & Pasture Land Triage Aggregates */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <span className="text-stone-500 font-medium">
                  {lang === 'kn' ? 'ಐತಿಹಾಸಿಕ ದಾಖಲಿತ ಗೋಮಾಳ' : 'Historical Baseline Gomal Extent'}
                </span>
                <p className="text-base font-bold text-stone-900">
                  {ExtentService.format(15360)} (24 Acres)
                </p>
                <p className="text-[11px] text-stone-500">From 1975-76 settlement register</p>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <span className="text-stone-500 font-medium">
                  {lang === 'kn' ? 'ಪರಿಶೀಲನಾ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿರುವ ಸರ್ವೆ ಸಂಖ್ಯೆಗಳು' : 'Parcels Under Review'}
                </span>
                <p className="text-base font-bold text-stone-900">
                  {villageParcels.length} / {currentVillage.total_parcels} parcels
                </p>
                <p className="text-[11px] text-stone-500">Documented via double-entry capture</p>
              </div>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="mt-6 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <button
              onClick={() => setShowRtcGuide(true)}
              className="flex items-center gap-1.5 text-emerald-800 font-semibold hover:underline cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              {lang === 'kn' ? 'ಪಹಣಿ (RTC) ಓದುವುದು ಹೇಗೆ? ಕೈಪಿಡಿ' : 'How to read an RTC Guide'}
            </button>
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-medium hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              {lang === 'kn' ? 'ಈ ಗ್ರಾಮದ ಬಗ್ಗೆ ವರದಿ ನೀಡಿ' : 'Submit Observation for Village'}
            </button>
          </div>
        </div>

        {/* Parcels List & Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-base">
              {lang === 'kn' ? 'ಸರ್ವೆ ನಂಬರ್‌ಗಳ ಪಟ್ಟಿ' : 'Village Survey Parcels'}
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              {filteredParcels.length} {lang === 'kn' ? 'ದಾಖಲೆಗಳು' : 'records'}
            </span>
          </div>

          {/* Search box */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder={lang === 'kn' ? 'ಸರ್ವೆ ನಂಬರ್ ಅಥವಾ ವರ್ಗೀಕರಣ ಹುಡುಕಿ...' : 'Search by survey number or classification...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Parcel List */}
          <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredParcels.map((parcel) => {
              const isSelected = selectedParcel?.id === parcel.id;
              const gateStatus = DataService.checkPublishingGate(parcel);
              const isPublicViewer = role === 'public_visitor';

              return (
                <div
                  key={parcel.id}
                  onClick={() => handleSelectParcel(parcel)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-50/70 border-emerald-400 shadow-xs' 
                      : 'bg-stone-50/50 hover:bg-stone-100/70 border-stone-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">
                          Sy {parcel.survey_number}{parcel.hissa !== '*' ? `/${parcel.hissa}` : ''}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">
                          ({ExtentService.format(parcel.gross_extent_anas)})
                        </span>
                      </div>
                      <div className="text-xs text-stone-600 mt-0.5">
                        <span>{lang === 'kn' ? 'ಮೂಲ:' : 'Base:'} <strong className="text-stone-800">{parcel.baseline_tenure}</strong></span>
                        <span className="mx-1">&rarr;</span>
                        <span>{lang === 'kn' ? 'ಪ್ರಸ್ತುತ:' : 'Current:'} <strong className="text-stone-800">{parcel.current_tenure}</strong></span>
                      </div>
                    </div>
                    <div>
                      {isPublicViewer && !gateStatus.canPublish ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lang === 'kn' ? 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' : 'Under Triage'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {t.tier_labels[parcel.tier]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Parcel Deep-Dive Dossier */}
      {selectedParcel && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm animate-in fade-in duration-200">
          {(() => {
            const gate = DataService.checkPublishingGate(selectedParcel);
            const isPublicVisitor = role === 'public_visitor';
            const docs = DataService.getDocumentsForParcel(selectedParcel.id);
            const rules = DataService.evaluateRulesForParcel(selectedParcel, tolAbs, tolRelBp);

            return (
              <div className="space-y-5">
                {/* Dossier Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-stone-900">
                        {lang === 'kn' ? 'ಸರ್ವೆ ನಂಬರ್ ದಾಖಲೆ ವಿವರ:' : 'Parcel Record Dossier:'} Sy {selectedParcel.survey_number}{selectedParcel.hissa !== '*' ? `/${selectedParcel.hissa}` : ''}
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                        {t.tier_labels[selectedParcel.tier]}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      {lang === 'kn' ? 'ಗ್ರಾಮ:' : 'Village:'} {currentVillage.name_en} ({currentVillage.name_kn}) | Taluk: {currentVillage.taluk} | Extent: {ExtentService.format(selectedParcel.gross_extent_anas)} ({selectedParcel.gross_extent_anas} anas)
                    </p>
                  </div>

                  {/* Takedown / Correction button */}
                  <button
                    onClick={() => setShowTakedownModal(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    {t.takedown.title}
                  </button>
                </div>

                {/* Gate Warning for Public Visitors */}
                {isPublicVisitor && !gate.canPublish && (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-700 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>{lang === 'kn' ? 'ಸಾರ್ವಜನಿಕ ಪ್ರಕಟಣೆ ತಡೆಗೋಡೆ (Publishing Gate):' : 'Publishing Gate Verification in Progress:'}</span>
                    </div>
                    <p>
                      {lang === 'kn'
                        ? 'ಈ ಸರ್ವೆ ನಂಬರಿನ ದಾಖಲೆಗಳು ಇನ್ನೂ ಸಂಪೂರ್ಣ ಪರಿಶೀಲನೆ ಹಾಗೂ ಕಂದಾಯ ಇಲಾಖೆಯ ಪ್ರತಿಕ್ರಿಯೆ ನಿರೀಕ್ಷೆಯಲ್ಲಿದೆ. ಸಾರ್ವಜನಿಕ ಗೌಪ್ಯತೆ ಮತ್ತು ನಿಷ್ಪಕ್ಷಪಾತ ನಿಯಮಗಳ ಪ್ರಕಾರ, 4 ಕಟ್ಟುನಿಟ್ಟಿನ ಷರತ್ತುಗಳು ಪೂರ್ಣಗೊಂಡ ನಂತರವೇ ಪೂರ್ಣ ವಿವರಗಳನ್ನು ಸಾರ್ವಜನಿಕವಾಗಿ ಪ್ರಕಟಿಸಲಾಗುತ್ತದೆ.'
                        : 'Detailed observations for this parcel are pending completion of the four publishing gates (Maker-Checker approval, 30-day revenue office window, approved neutral phrasing, and golden set calibration).'}
                    </p>
                  </div>
                )}

                {/* Approved Neutral Public Text (if published or if reviewer) */}
                {(!isPublicVisitor || gate.canPublish) && (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                      {lang === 'kn' ? 'ಅನುಮೋದಿತ ತಟಸ್ಥ ವಿವರಣೆ (Approved Public Record Summary):' : 'Approved Factual Summary:'}
                    </span>
                    <p className="text-sm font-medium text-stone-800 leading-relaxed">
                      {selectedParcel.wording_code === 'P4_REPLY_STATED_NO_ORDER'
                        ? (lang === 'kn'
                            ? 'ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿಗೆ ನೀಡಿದ ಅಧಿಕೃತ ಲಿಖಿತ ಉತ್ತರದಲ್ಲಿ, ಈ ವರ್ಗೀಕರಣ ಬದಲಾವಣೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಯಾವುದೇ ಸರ್ಕಾರಿ ಆದೇಶ ಹೊರಡಿಸಲಾಗಿಲ್ಲ ಎಂದು ಸಕ್ಷಮ ಕಂದಾಯ ಪ್ರಾಧಿಕಾರವು ಸ್ಪಷ್ಟಪಡಿಸಿದೆ. ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆ ಕೋರಲಾಗಿದೆ.'
                            : 'In response to an RTI application, the competent revenue authority confirmed in writing that no official order was issued for this tenure change. Verification is requested.')
                        : selectedParcel.wording_code === 'P2_SUBDIVISION_EXTENT_DISCREPANCY'
                        ? (lang === 'kn'
                            ? 'ದಾಖಲಾಗಿರುವ ಹಿಸ್ಸಾಗಳ ಒಟ್ಟು ವಿಸ್ತೀರ್ಣವು ಮೂಲ ಸರ್ವೆ ನಂಬರಿನ ವಿಸ್ತೀರ್ಣಕ್ಕಿಂತ ಸಿಸ್ಟಮ್ ಟಾಲರೆನ್ಸ್‌ಗಿಂತ ಅಧಿಕವಾಗಿದೆ. ಮೂಲ ದಾಖಲೆಗಳಲ್ಲಿ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಿದ್ದು, ಪರಿಶೀಲನೆ ಕೋರಲಾಗಿದೆ.'
                            : 'The sum of the recorded sub-division extents exceeds the recorded parent survey extent beyond system tolerance. Source documents disagree. Verification is requested.')
                        : selectedParcel.wording_code === 'P3_ORDER_VERIFIED'
                        ? (lang === 'kn'
                            ? 'ದಾಖಲಾದ ದಾಖಲೆಗಳಲ್ಲಿ ವರ್ಗೀಕರಣ ಬದಲಾವಣೆಯಾಗಿದ್ದು, ಇದಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಆದೇಶದ ಪ್ರತಿಯನ್ನು ಲಗತ್ತಿಸಿ ಪರಿಶೀಲಕರಿಂದ ಖಚಿತಪಡಿಸಲಾಗಿದೆ.'
                            : 'The entered records show a change in tenure classification, and an official order document has been attached and confirmed by a reviewer.')
                        : (lang === 'kn'
                            ? 'ದಾಖಲಾದ ಪಹಣಿಗಳ ಪ್ರಕಾರ ಕಾಲಾನಂತರದಲ್ಲಿ ಜಮೀನಿನ ಹಿಡುವಳಿ ನಮೂನೆ ಬದಲಾವಣೆಯಾಗಿರುವುದು ಕಂಡುಬಂದಿದೆ. ಒದಗಿಸಲಾದ ದಾಖಲೆಗಳಲ್ಲಿ ಯಾವುದೇ ಸಂಬಂಧಿತ ಆದೇಶ ಕಂಡುಬಂದಿಲ್ಲ. ಕಂದಾಯ ಕಚೇರಿಯಿಂದ ಪರಿಶೀಲನೆ ಕೋರಲಾಗಿದೆ.'
                            : 'The records entered show a change in tenure classification over time. No linked order was found among the documents entered. Verification is requested from the revenue office.')}
                    </p>
                  </div>
                )}

                {/* Deterministic Rule Engine Results Breakdown */}
                {(!isPublicVisitor || gate.canPublish) && (
                  <div>
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      {lang === 'kn' ? 'ನಿಯಮಗಳ ಲೆಕ್ಕಾಚಾರ ಫಲಿತಾಂಶಗಳು (Rule Engine Outcomes)' : 'Rule Engine Outcomes (Pure Server Logic)'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {rules.map((rule, idx) => (
                        <div key={idx} className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 text-xs flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-stone-900">{rule.rule_name}</span>
                              <span className="text-[10px] text-stone-500">v{rule.rule_version}</span>
                            </div>
                            <div className="mb-2">
                              {getStatusBadge(rule.state)}
                            </div>
                            <p className="text-stone-600 line-clamp-3 leading-relaxed">
                              {rule.reason}
                            </p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-stone-200/60 text-[10px] text-stone-500 flex justify-between">
                            <span>Docs: {rule.input_document_ids.length}</span>
                            <span>{new Date(rule.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached Certified Documents */}
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    {lang === 'kn' ? 'ಲಗತ್ತಿಸಲಾದ ಮೂಲ ದಾಖಲೆಗಳು (Certified Documents)' : 'Attached Source Documents'}
                  </h4>
                  {docs.length === 0 ? (
                    <p className="text-xs text-stone-500 italic">No source documents attached yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {docs.map((doc) => (
                        <div key={doc.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                              <span>{doc.document_type}</span>
                              {doc.reviewer_confirmed && (
                                <span className="text-emerald-700 flex items-center gap-0.5 text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" /> Confirmed
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-700 font-medium mt-1">{doc.title}</p>
                            <p className="text-[10px] text-stone-400 font-mono mt-1 truncate" title={doc.sha256_hash}>
                              SHA: {doc.sha256_hash.substring(0, 16)}...
                            </p>
                          </div>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {lang === 'kn' ? 'ದಾಖಲೆ ವೀಕ್ಷಿಸಿ' : 'View Document'}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Privacy Boundary & Structural Cryptographic Decryption (Reviewer only) */}
                <div className="bg-stone-100/60 p-4 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                        <EyeOff className="w-4 h-4 text-stone-500" />
                        {lang === 'kn' ? 'ವೈಯಕ್ತಿಕ ಹೆಸರುಗಳ ರಚನಾತ್ಮಕ ಗೌಪ್ಯತೆ (Privacy by Structure)' : 'Personal Identity Field (Privacy by Structure)'}
                      </span>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {lang === 'kn' 
                          ? 'ಖಾತೆದಾರರ ಹೆಸರು ಸಾರ್ವಜನಿಕವಾಗಿ ಎಂದಿಗೂ ಪ್ರದರ್ಶಿತವಾಗುವುದಿಲ್ಲ. ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ.' 
                          : 'Khatedar name is envelope-encrypted. Never displayed on public surface.'}
                      </p>
                    </div>

                    {/* Decrypt trigger for verifiers */}
                    {(role === 'verifier' || role === 'admin') && (
                      <div>
                        {decryptedName ? (
                          <div className="text-xs font-bold text-stone-900 bg-white px-3 py-1 rounded-lg border border-stone-300">
                            {decryptedName}
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDecryptPrompt(true)}
                            className="text-xs font-semibold px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg text-stone-700 cursor-pointer"
                          >
                            {lang === 'kn' ? 'ಆಡಿಟ್ ಸಹಿತ ಹೆಸರು ವೀಕ್ಷಿಸಿ' : 'Decrypt with Audit Log'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Decryption justification prompt */}
                  {showDecryptPrompt && (
                    <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-2">
                      <p className="text-xs font-semibold text-amber-800">
                        {lang === 'kn' ? 'ಪರಿಶೀಲಕರ ಕಾರಣ ನಮೂದಿಸುವುದು ಕಡ್ಡಾಯ (ಆಡಿಟ್ ಲಾಗ್‌ಗೆ ದಾಖಲಾಗುತ್ತದೆ):' : 'Mandatory: Enter verified reason for decrypting personal name (recorded in immutable audit log):'}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Cross-verifying mutation register entry with certified RTC..."
                          value={decryptJustification}
                          onChange={(e) => setDecryptJustification(e.target.value)}
                          className="flex-1 px-3 py-1 text-xs border border-stone-300 rounded-md bg-white focus:outline-none"
                        />
                        <button
                          onClick={handlePerformDecryption}
                          className="px-3 py-1 bg-stone-900 text-white rounded-md text-xs font-semibold hover:bg-stone-800 cursor-pointer"
                        >
                          Decrypt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Educational Guide Modal: How to Read an RTC / ಪಹಣಿ */}
      {showRtcGuide && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-stone-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-stone-900 text-lg">
                  {lang === 'kn' ? 'ಪಹಣಿ (RTC) ಓದುವುದು ಹೇಗೆ? ಕೈಪಿಡಿ' : 'How to Read a Karnataka RTC (Pahani)'}
                </h3>
              </div>
              <button
                onClick={() => setShowRtcGuide(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                <h4 className="font-bold text-emerald-950 text-sm mb-1">
                  1. {lang === 'kn' ? 'ವಿಸ್ತೀರ್ಣ ಅಳತೆ (Area in Acres, Guntas, Anas)' : 'Extent Representation (Acre-Gunta-Ana)'}
                </h4>
                <p>
                  {lang === 'kn'
                    ? 'ಕರ್ನಾಟಕದ ಪಹಣಿಗಳಲ್ಲಿ ವಿಸ್ತೀರ್ಣವನ್ನು ಎಕರೆ-ಗುಂಟೆ-ಆಣೆಗಳಲ್ಲಿ ನಮೂದಿಸಲಾಗುತ್ತದೆ. 1 ಎಕರೆ = 40 ಗುಂಟೆಗಳು. 1 ಗುಂಟೆ = 16 ಆಣೆಗಳು. ಆದ್ದರಿಂದ 1 ಎಕರೆ = 640 ಆಣೆಗಳು. ನಮ್ಮ ಸಿಸ್ಟಮ್ ಯಾವುದೇ ಫ್ಲೋಟಿಂಗ್ ಪಾಯಿಂಟ್ ಬಳಸದೆ ನೇರವಾಗಿ ಆಣೆಗಳಲ್ಲಿ ಲೆಕ್ಕಾಚಾರ ಮಾಡುತ್ತದೆ.'
                    : 'RTC extents are recorded as Acres-Guntas-Anas. 1 Acre = 40 Guntas; 1 Gunta = 16 Anas; 1 Acre = 640 Anas. Our system performs zero floating-point arithmetic to guarantee exact legal precision.'}
                </p>
              </div>

              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <h4 className="font-bold text-stone-900 text-sm mb-1">
                  2. {lang === 'kn' ? 'ಖರಾಬು ಜಮೀನು ಎಂದರೇನು? (Kharab A vs Kharab B)' : 'Understanding Kharab Lands (A vs B)'}
                </h4>
                <p>
                  {lang === 'kn'
                    ? 'ಖರಾಬು ಎಂದರೆ ಕೃಷಿಗೆ ಬಳಸಲಾಗದ ಜಮೀನು. ಎ-ಖರಾಬು (ಕಲ್ಲು, ಬಂಡೆ, ಹಳ್ಳ) ರೈತರ ಒಡೆತನದಲ್ಲೇ ಇರುತ್ತದೆ. ಬಿ-ಖರಾಬು (ರಸ್ತೆ, ಕಾಲುದಾರಿ, ಕೆರೆ, ಗೋಮಾಳ, ಸ್ಮಶಾನ) ಸಂಪೂರ್ಣ ಸಾರ್ವಜನಿಕ ಉದ್ದೇಶಕ್ಕೆ ಮೀಸಲಾಗಿದ್ದು, ಇದನ್ನು ಯಾವುದೇ ವ್ಯಕ್ತಿಗೆ ಖಾಸಗಿಯಾಗಿ ಮಂಜೂರು ಮಾಡುವಂತಿಲ್ಲ.'
                    : 'Kharab denotes uncultivable extent. A-Kharab (topography, rocks) remains with the occupant. B-Kharab (roads, paths, watercourses, pasture/Gomal, burial grounds) is strictly reserved for public use and cannot be granted to individuals.'}
                </p>
              </div>

              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-950 text-sm mb-1">
                  3. {lang === 'kn' ? 'ಗೋಮಾಳ ಕಾಯ್ದಿರಿಸುವಿಕೆ (Karnataka Land Revenue Act)' : 'Gomala Reservation (Section 71)'}
                </h4>
                <p>
                  {lang === 'kn'
                    ? 'ಕರ್ನಾಟಕ ಭೂ ಕಂದಾಯ ಕಾಯಿದೆ 1964 ರ ಕಲಂ 71 ಹಾಗೂ ನಿಯಮಾವಳಿ 97 ರ ಪ್ರಕಾರ ಗ್ರಾಮದ ಪ್ರತಿ 100 ಜಾನುವಾರುಗಳಿಗೆ ಕನಿಷ್ಠ 12 ಹೆಕ್ಟೇರ್ (ಸುಮಾರು 30 ಎಕರೆ) ಗೋಮಾಳ ಜಮೀನನ್ನು ಕಾಯ್ದಿರಿಸಬೇಕು. ಜಿಲ್ಲಾಧಿಕಾರಿಗಳ ಪೂರ್ವಾನುಮತಿಯಿಲ್ಲದೆ ಗೋಮಾಳ ವರ್ಗೀಕರಣ ಬದಲಾಯಿಸುವುದು ನಿಯಮಬಾಹಿರ.'
                    : 'Under Section 71 of the Karnataka Land Revenue Act, 1964 and Rule 97, pasture land (Gomal) must be reserved for village cattle at the statutory ratio. Any change of classification requires formal sanction by the competent revenue authority.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setShowRtcGuide(false)}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Takedown / Factual Correction Request Modal */}
      {showTakedownModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-base">
                {t.takedown.title}
              </h3>
              <button
                onClick={() => setShowTakedownModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {takedownSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-stone-900 text-base">
                  {lang === 'kn' ? 'ಮನವಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ' : 'Takedown Request Logged'}
                </h4>
                <p className="text-xs text-stone-600">
                  {lang === 'kn'
                    ? 'ನಿಮ್ಮ ತಿದ್ದುಪಡಿ ಅರ್ಜಿಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದ್ದು, ಆಡಿಟ್ ಲಾಗ್‌ನಲ್ಲಿ ನಮೂದಿಸಲಾಗಿದೆ. ನಮ್ಮ ಕಾನೂನು ಪರಿಶೀಲಕರು 72 ಗಂಟೆಗಳಲ್ಲಿ ಕ್ರಮ ಕೈಗೊಳ್ಳಲಿದ್ದಾರೆ.'
                    : 'Your grievance has been logged in the cryptographic audit chain. The designated takedown officer will review within 72 hours.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleTakedownSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    {t.takedown.name} *
                  </label>
                  <input
                    type="text"
                    required
                    value={takedownName}
                    onChange={(e) => setTakedownName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="e.g., S. Venkataswamy"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    {t.takedown.interest} *
                  </label>
                  <input
                    type="text"
                    required
                    value={takedownInterest}
                    onChange={(e) => setTakedownInterest(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="e.g., Registered Khatedar / Legal Heir / Advocate"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    {t.takedown.reason} *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={takedownReason}
                    onChange={(e) => setTakedownReason(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="Please specify any factual discrepancy, certified order copy details, or privacy concern..."
                  />
                </div>

                <p className="text-[11px] text-stone-500 italic">
                  Note: All requests are recorded in the append-only cryptographic audit log with timestamp.
                </p>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTakedownModal(false)}
                    className="px-3 py-1.5 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-900 cursor-pointer"
                  >
                    {t.takedown.submit}
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
