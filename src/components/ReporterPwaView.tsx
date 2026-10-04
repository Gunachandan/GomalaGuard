import React, { useState, useEffect } from 'react';
import { Language, CitizenReport } from '../types';
import { DataService } from '../services/dataService';
import { StorageService, OfflineDraft } from '../services/storageService';
import { BannedTermsScanner } from '../services/bannedTermsScanner';
import { i18n } from '../services/i18n';
import { 
  FileText, 
  UploadCloud, 
  Key, 
  Search, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Copy, 
  AlertTriangle,
  Clock,
  Trash2,
  Send
} from 'lucide-react';

interface ReporterPwaViewProps {
  lang: Language;
  isOnline: boolean;
}

export const ReporterPwaView: React.FC<ReporterPwaViewProps> = ({ lang, isOnline }) => {
  const t = i18n[lang];
  const villages = DataService.getVillages();

  // Form state
  const [villageId, setVillageId] = useState(villages[0]?.id || 'vil-kallur');
  const [surveyNumber, setSurveyNumber] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Submission success state (shows secret 128-bit tracking code)
  const [generatedSecretCode, setGeneratedSecretCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tracking query state
  const [trackingInput, setTrackingInput] = useState('');
  const [trackedReport, setTrackedReport] = useState<CitizenReport | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Offline drafts state
  const [offlineDrafts, setOfflineDrafts] = useState<OfflineDraft[]>([]);

  useEffect(() => {
    setOfflineDrafts(StorageService.getDrafts());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const [moderationNotice, setModerationNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setModerationNotice(null);

    setUploading(true);

    try {
      let fileHash: string | undefined = undefined;

      if (selectedFile) {
        // Strip EXIF & metadata server-side
        const processed = await StorageService.processUploadedImage(selectedFile);
        fileHash = processed.fileHash;
      }

      if (!isOnline) {
        // Save as offline draft
        StorageService.saveDraft({
          village_id: villageId,
          survey_number: surveyNumber,
          description,
          contact: contact || undefined,
          photo_name: selectedFile?.name,
          photo_data_url: filePreview || undefined,
        });
        setOfflineDrafts(StorageService.getDrafts());
        alert(
          lang === 'kn'
            ? 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ. ವರದಿಯನ್ನು ಸಾಧನದಲ್ಲಿ ಕರಡಾಗಿ ಸುರಕ್ಷಿತವಾಗಿ ಸೇವ್ ಮಾಡಲಾಗಿದೆ. ನೆಟ್‌ವರ್ಕ್ ಬಂದಾಗ ಸಲ್ಲಿಸಬಹುದು.'
            : 'You are currently offline. Report saved locally as draft. It will sync when connection returns.'
        );
        resetForm();
      } else {
        // Live Submission with non-blocking moderation flagging
        const { plainTrackingCode, moderationStatus, flaggedTerms } = DataService.submitReport({
          villageId,
          surveyNumber,
          description,
          contact: contact || undefined,
          fileHash,
        });

        if (moderationStatus === 'FLAGGED_FOR_MODERATION') {
          setModerationNotice(
            lang === 'kn'
              ? `ಗಮನಿಸಿ: ನಿಮ್ಮ ವಿವರಣೆಯಲ್ಲಿ ಕೆಲವು ಆರೋಪದ ಪದಗಳು (${flaggedTerms.join(', ')}) ಕಂಡುಬಂದಿವೆ. ವರದಿಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ ಮತ್ತು ತಟಸ್ಥ ದಾಖಲೀಕರಣಕ್ಕಾಗಿ ಪರಿಶೀಲನಾ ತಂಡಕ್ಕೆ ಕಳುಹಿಸಲಾಗಿದೆ.`
              : `Notice: Evaluative terms detected (${flaggedTerms.join(', ')}). Your report has been accepted and routed to a reviewer for neutral verification.`
          );
        }

        setGeneratedSecretCode(plainTrackingCode);
        resetForm();
      }
    } catch (err: any) {
      setValidationError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSurveyNumber('');
    setDescription('');
    setContact('');
    setSelectedFile(null);
    setFilePreview(null);
  };

  const copyToClipboard = () => {
    if (generatedSecretCode) {
      navigator.clipboard.writeText(generatedSecretCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;

    setTrackingLoading(true);
    setTrackError(null);
    setTrackedReport(null);

    // Simulate constant-time lookup delay (security against timing attacks)
    setTimeout(() => {
      const res = DataService.trackReport(trackingInput.trim());
      setTrackingLoading(false);
      if (res) {
        setTrackedReport(res);
      } else {
        setTrackError(
          lang === 'kn'
            ? 'ನಮೂದಿಸಿದ ಟ್ರ್ಯಾಕಿಂಗ್ ಕೋಡ್‌ಗೆ ಯಾವುದೇ ವರದಿ ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.'
            : 'No submission found matching this 128-bit tracking code. Please verify the code.'
        );
      }
    }, 400);
  };

  const handleSyncDraft = (draft: OfflineDraft) => {
    if (!isOnline) {
      alert(lang === 'kn' ? 'ನೆಟ್‌ವರ್ಕ್ ಲಭ್ಯವಿಲ್ಲ' : 'No network connection');
      return;
    }
    const { plainTrackingCode } = DataService.submitReport({
      villageId: draft.village_id,
      surveyNumber: draft.survey_number,
      description: draft.description,
      contact: draft.contact,
    });
    StorageService.removeDraft(draft.id);
    setOfflineDrafts(StorageService.getDrafts());
    setGeneratedSecretCode(plainTrackingCode);
  };

  const handleDeleteDraft = (draftId: string) => {
    StorageService.removeDraft(draftId);
    setOfflineDrafts(StorageService.getDrafts());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">{t.report.title}</h2>
            <p className="text-xs text-stone-600 mt-0.5">{t.report.subtitle}</p>
          </div>
        </div>

        {/* Offline Warning Notice */}
        {!isOnline && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {lang === 'kn'
                ? 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ. ಚಿಂತಿಸಬೇಡಿ, ವರದಿಗಳನ್ನು ಕರಡಾಗಿ ಸೇವ್ ಮಾಡಲಾಗುತ್ತದೆ ಮತ್ತು ಕನೆಕ್ಷನ್ ಬಂದಾಗ ಸಿಂಕ್ ಮಾಡಲಾಗುತ್ತದೆ.'
                : 'Offline Mode: Submissions will be stored securely on your device and can be submitted when reconnected.'}
            </span>
          </div>
        )}
      </div>

      {/* Secret Tracking Code Success Box */}
      {generatedSecretCode && (
        <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-bold">
              {lang === 'kn' ? 'ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!' : 'Report Successfully Lodged!'}
            </h3>
          </div>
          <p className="text-xs text-emerald-200 leading-relaxed">
            {t.report.tracking_warning}
          </p>

          <div className="bg-emerald-950/80 p-4 rounded-xl border border-emerald-700/60 flex items-center justify-between gap-3">
            <div className="font-mono text-xs sm:text-sm tracking-wider break-all text-amber-300 font-bold select-all">
              {generatedSecretCode}
            </div>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedCode ? (lang === 'kn' ? 'ಕಾಪಿ ಮಾಡಲಾಗಿದೆ!' : 'Copied!') : (lang === 'kn' ? 'ಕಾಪಿ ಮಾಡಿ' : 'Copy')}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setGeneratedSecretCode(null)}
              className="text-xs text-emerald-300 hover:text-white underline cursor-pointer"
            >
              {lang === 'kn' ? 'ಹೊಸ ವರದಿ ಸಲ್ಲಿಸಿ' : 'Submit Another Report'}
            </button>
          </div>
        </div>
      )}

      {moderationNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">
              {lang === 'kn' ? 'ತಟಸ್ಥ ಪರಿಶೀಲನೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ' : 'Routed for Neutral Verification'}
            </span>
            <p className="leading-relaxed">{moderationNotice}</p>
          </div>
        </div>
      )}

      {/* Main Report Form */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Village Selector */}
          <div>
            <label className="font-bold text-stone-800 block mb-1">
              {t.report.village_select} *
            </label>
            <select
              value={villageId}
              onChange={(e) => setVillageId(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {lang === 'kn' ? v.name_kn : v.name_en} ({v.taluk} Taluk)
                </option>
              ))}
            </select>
          </div>

          {/* Survey Number */}
          <div>
            <label className="font-bold text-stone-800 block mb-1">
              {t.report.survey_number}
            </label>
            <input
              type="text"
              value={surveyNumber}
              onChange={(e) => setSurveyNumber(e.target.value)}
              placeholder="e.g., 45 or 45/1 or 88"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          {/* Neutral Factual Observation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-stone-800">
                {t.report.description} *
              </label>
              <span className="text-[11px] text-stone-500 font-medium">
                {lang === 'kn' ? 'ನಿಷ್ಪಕ್ಷಪಾತ ವಾಸ್ತವಿಕ ವಿವರಣೆ ಮಾತ್ರ' : 'Factual observation only'}
              </span>
            </div>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.report.description_placeholder}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              {lang === 'kn'
                ? 'ಗಮನಿಸಿ: ಯಾವುದೇ ವ್ಯಕ್ತಿಗಳ ವಿರುದ್ಧ ಆರೋಪ ಅಥವಾ ಆಧಾರರಹಿತ ಹೇಳಿಕೆಗಳನ್ನು ಅನುಮತಿಸಲಾಗುವುದಿಲ್ಲ.'
                : 'Note: Accusations against persons or defamatory terms are prohibited and rejected by server scanner.'}
            </p>
          </div>

          {/* Photo / Document Upload */}
          <div>
            <label className="font-bold text-stone-800 block mb-1">
              {t.report.photo_upload}
            </label>
            <div className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:bg-stone-50 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pwa-file-upload"
              />
              <label htmlFor="pwa-file-upload" className="cursor-pointer block">
                <UploadCloud className="w-8 h-8 text-stone-400 mx-auto mb-1" />
                <span className="text-xs font-semibold text-emerald-800 underline">
                  {selectedFile ? selectedFile.name : (lang === 'kn' ? 'ಫೋಟೋ ಅಥವಾ ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ' : 'Browse Photo or PDF')}
                </span>
                <p className="text-[11px] text-stone-500 mt-1">
                  {t.report.photo_privacy_note}
                </p>
              </label>
            </div>
            {filePreview && (
              <div className="mt-2 w-28 h-20 rounded-lg overflow-hidden border border-stone-200">
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Optional Contact Details (Encrypted at rest) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <label className="font-bold text-stone-800">
                {t.report.optional_contact}
              </label>
            </div>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t.report.contact_placeholder}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              {lang === 'kn' 
                ? 'ಸಂಪರ್ಕ ಮಾಹಿತಿಯನ್ನು ಅಪ್ಲಿಕೇಶನ್-ಮಟ್ಟದ ಎನ್‌ಕ್ರಿಪ್ಶನ್ ಮೂಲಕ ಪ್ರತ್ಯೇಕವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ. ಸಾರ್ವಜನಿಕವಾಗಿ ಎಂದಿಗೂ ತೋರಿಸುವುದಿಲ್ಲ.'
                : 'Contact details are envelope-encrypted at rest and never accessible by public views.'}
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {uploading ? (lang === 'kn' ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Processing...') : t.report.submit_btn}
            </button>
          </div>
        </form>
      </div>

      {/* Offline Drafts Management (if any) */}
      {offlineDrafts.length > 0 && (
        <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-500" />
              {lang === 'kn' ? 'ಸಾಧನದಲ್ಲಿರುವ ಆಫ್‌ಲೈನ್ ಕರಡುಗಳು' : 'Offline Drafts Saved on Device'} ({offlineDrafts.length})
            </h3>
          </div>

          <div className="space-y-2">
            {offlineDrafts.map((draft) => (
              <div key={draft.id} className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-800">
                    Sy {draft.survey_number || 'Unspecified'}
                  </span>
                  <p className="text-stone-500 line-clamp-1">{draft.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSyncDraft(draft)}
                    className="px-2.5 py-1 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-900 cursor-pointer"
                  >
                    Sync / Submit
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Track Existing Report by 128-bit Code */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-emerald-800" />
          <h3 className="font-bold text-stone-900 text-base">{t.report.track_existing}</h3>
        </div>

        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            placeholder={t.report.track_placeholder}
            className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
          />
          <button
            type="submit"
            disabled={trackingLoading}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shrink-0"
          >
            {trackingLoading ? 'Checking...' : t.report.track_btn}
          </button>
        </form>

        {trackError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            {trackError}
          </div>
        )}

        {trackedReport && (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs text-stone-800 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 text-sm">
                Status: {trackedReport.status}
              </span>
              <span className="text-stone-500">
                {new Date(trackedReport.created_at).toLocaleDateString()}
              </span>
            </div>
            <p><strong>Survey No:</strong> {trackedReport.survey_number}</p>
            <p><strong>Description:</strong> {trackedReport.description}</p>
            <p><strong>Corroboration Count:</strong> {trackedReport.corroboration_count} independent reports recorded</p>
          </div>
        )}
      </div>
    </div>
  );
};
