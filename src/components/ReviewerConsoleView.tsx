import React, { useState } from 'react';
import { UserRole, Language, Task, TenureTermMapping, TierChangeRequest, EvidenceTier } from '../types';
import { DataService } from '../services/dataService';
import { TemplateService } from '../services/templateService';
import { i18n } from '../services/i18n';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  BookOpen, 
  ShieldAlert, 
  ArrowRight, 
  Printer, 
  Download,
  Send,
  Plus
} from 'lucide-react';

interface ReviewerConsoleViewProps {
  role: UserRole;
  lang: Language;
}

export const ReviewerConsoleView: React.FC<ReviewerConsoleViewProps> = ({ role, lang }) => {
  const t = i18n[lang];
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'tenure' | 'tiers' | 'templates'>('tasks');

  // Task queue state
  const [tasks, setTasks] = useState<Task[]>(DataService.getTasks());
  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0] || null);

  // Tenure mapping state
  const [tenureTerms, setTenureTerms] = useState<TenureTermMapping[]>(DataService.getTenureTerms());
  const [newRawTerm, setNewRawTerm] = useState('');
  const [newCanonicalCode, setNewCanonicalCode] = useState('GOMAL');

  // Tier change state
  const [tierRequests, setTierRequests] = useState<TierChangeRequest[]>(DataService.getTierRequests());
  const [proposeParcelId, setProposeParcelId] = useState('par-45');
  const [proposeToTier, setProposeToTier] = useState<EvidenceTier>('T2_OFFICE_ASKED');
  const [proposeJustification, setProposeJustification] = useState('');
  const [tierError, setTierError] = useState<string | null>(null);
  const [tierSuccess, setTierSuccess] = useState<string | null>(null);

  // Templates state
  const [templateType, setTemplateType] = useState<'RTI' | 'VERIFICATION'>('RTI');
  const [templateLang, setTemplateLang] = useState<'kn' | 'en'>(lang);
  const [applicantName, setApplicantName] = useState('ಮಹೇಶ್ ಗೌಡ (Mahesh Gowda)');
  const [applicantAddress, setApplicantAddress] = useState('ಕಲ್ಲೂರು ಗ್ರಾಮ, ಗುಬ್ಬಿ ತಾಲೂಕು, ತುಮಕೂರು ಜಿಲ್ಲೆ');
  const [surveyNum, setSurveyNum] = useState('45');
  const [hissaNum, setHissaNum] = useState('1');
  const [generatedDocText, setGeneratedDocText] = useState('');

  const generateTemplate = () => {
    const params = {
      language: templateLang,
      applicantName,
      applicantAddress,
      applicantPhone: '9845000000',
      villageNameKn: 'ಕಲ್ಲೂರು',
      villageNameEn: 'Kallur',
      talukName: 'ಗುಬ್ಬಿ (Gubbi)',
      districtName: 'ತುಮಕೂರು (Tumakuru)',
      surveyNumber: surveyNum,
      hissaNumber: hissaNum,
      historicalClassification: 'ಗೋಮಾಳ (Gomal)',
      currentClassification: 'ಖಾಸ್ ದರಖಾಸ್ತು (Khas Darakht)',
      mutationRef: 'MR 04/2012',
    };

    if (templateType === 'RTI') {
      setGeneratedDocText(TemplateService.generateRtiApplication(params));
    } else {
      setGeneratedDocText(TemplateService.generateVerificationRequest(params));
    }
  };

  const handleMapTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRawTerm.trim()) return;
    DataService.mapTenureTerm(
      newRawTerm.trim(),
      newCanonicalCode,
      role,
      role === 'verifier' ? 'Senior Verifier' : 'Coordinator'
    );
    setTenureTerms([...DataService.getTenureTerms()]);
    setNewRawTerm('');
  };

  const handleProposeTierChange = (e: React.FormEvent) => {
    e.preventDefault();
    setTierError(null);
    setTierSuccess(null);

    if (!proposeJustification.trim()) {
      setTierError('Justification is mandatory for proposing tier changes');
      return;
    }

    try {
      DataService.proposeTierChange(
        proposeParcelId,
        proposeToTier,
        role === 'moderator' ? 'moderator_anand' : 'reviewer_lead',
        role === 'moderator' ? 'Anand K. (Moderator)' : 'Lead Reviewer',
        proposeJustification
      );
      setTierRequests([...DataService.getTierRequests()]);
      setTierSuccess('Tier change proposed successfully. Awaiting independent Checker approval.');
      setProposeJustification('');
    } catch (err: any) {
      setTierError(err.message);
    }
  };

  const handleApproveTierChange = (reqId: string) => {
    setTierError(null);
    setTierSuccess(null);

    try {
      // Current active user acts as Checker
      const currentCheckerId = role === 'verifier' ? 'verifier_sumana' : 'admin_checker';
      const currentCheckerName = role === 'verifier' ? 'Sumana Rao (Senior Verifier)' : 'Admin Checker';

      DataService.approveTierChange(reqId, currentCheckerId, currentCheckerName);
      setTierRequests([...DataService.getTierRequests()]);
      setTierSuccess('Tier change approved and logged in cryptographic audit chain.');
    } catch (err: any) {
      setTierError(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Console Header */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <ClipboardCheck className="w-4 h-4" />
            <span>{t.reviewer.tasks_title}</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            {lang === 'kn' ? 'ಪರಿಶೀಲಕರ ನಿರ್ವಹಣಾ ಕನ್ಸೋಲ್' : 'Reviewer & Verification Console'}
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            {t.reviewer.maker_checker_rule}
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'tasks' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.reviewer.tasks_title}
          </button>
          <button
            onClick={() => setActiveSubTab('tenure')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'tenure' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.reviewer.tenure_mapping}
          </button>
          <button
            onClick={() => setActiveSubTab('tiers')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'tiers' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.reviewer.tier_change}
          </button>
          <button
            onClick={() => {
              setActiveSubTab('templates');
              generateTemplate();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'templates' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {lang === 'kn' ? 'RTI & ಪರಿಶೀಲನಾ ಪತ್ರ' : 'RTI & Verification Memo'}
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Task Queue */}
      {activeSubTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center justify-between">
              <span>{lang === 'kn' ? 'ಬಾಕಿ ಇರುವ ಕಾರ್ಯಗಳು' : 'Pending Tasks Queue'}</span>
              <span className="text-xs text-stone-500 font-normal">({tasks.length} tasks)</span>
            </h3>

            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                    selectedTask?.id === task.id
                      ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                      : 'bg-stone-50/50 hover:bg-stone-100 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">
                      {task.village_name} - Sy {task.survey_number}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                      Rule {task.created_by_rule}
                    </span>
                  </div>
                  <p className="text-stone-600 mt-1 font-medium line-clamp-2">
                    {task.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
            {selectedTask ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-stone-200">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                    Task Details
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 mt-1">
                    {selectedTask.task_type} for Survey {selectedTask.survey_number}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Deduplication Key: <code className="text-stone-700">{selectedTask.deduplication_key}</code>
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-2">
                  <div>
                    <span className="font-bold text-stone-700">Objective:</span>
                    <p className="text-stone-800 mt-0.5">{selectedTask.reason}</p>
                  </div>
                  <div>
                    <span className="font-bold text-stone-700">Generated By:</span>
                    <p className="text-stone-800 mt-0.5">Rule Engine ({selectedTask.created_by_rule})</p>
                  </div>
                  <div>
                    <span className="font-bold text-stone-700">Created:</span>
                    <p className="text-stone-800 mt-0.5">{new Date(selectedTask.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      alert('Task marked as in-progress. Verifier assigned.');
                    }}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Assign to Me
                  </button>
                  <button
                    onClick={() => {
                      setActiveSubTab('templates');
                      setSurveyNum(selectedTask.survey_number);
                      generateTemplate();
                    }}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Draft Verification Memorandum
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-stone-500 text-xs">
                Select a task to review details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Tenure Term Mapping */}
      {activeSubTab === 'tenure' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-stone-900">{t.reviewer.tenure_mapping}</h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Normalizes regional Kannada land record terminology to deterministic canonical codes (e.g. GOMAL, INAM, PATTA_PRIVATE).
            </p>
          </div>

          <form onSubmit={handleMapTermSubmit} className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row gap-3 text-xs">
            <div className="flex-1">
              <label className="font-bold text-stone-700 block mb-1">
                {lang === 'kn' ? 'ಮೂಲ ಪಹಣಿ ಪದ (Raw Kannada Term)' : 'Raw Kannada Record Term'} *
              </label>
              <input
                type="text"
                required
                value={newRawTerm}
                onChange={(e) => setNewRawTerm(e.target.value)}
                placeholder="ಉದಾ: ಗೋ.ಖಾ.ಬಂ ಅಥವಾ ಸಾರ್ವಜನಿಕ ಮೇಯುವಿಕೆ"
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {lang === 'kn' ? 'ಕ್ಯಾನೋನಿಕಲ್ ಕೋಡ್ (Canonical Code)' : 'Canonical Vocabulary Code'} *
              </label>
              <select
                value={newCanonicalCode}
                onChange={(e) => setNewCanonicalCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none"
              >
                <option value="GOMAL">GOMAL (Village Pasture Land)</option>
                <option value="PATTA_PRIVATE">PATTA_PRIVATE (Private Occupancy)</option>
                <option value="KHAS_DARAKHT">KHAS_DARAKHT (Special Trees/Grass)</option>
                <option value="INAM_ABOLISHED">INAM_ABOLISHED (Former Inam Land)</option>
                <option value="PUBLIC_HOSPITAL">PUBLIC_HOSPITAL (Public Hospital)</option>
                <option value="SARKARI_OTHER">SARKARI_OTHER (Other Govt Land)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold cursor-pointer"
              >
                Map Term
              </button>
            </div>
          </form>

          {/* Mapping Table */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 text-[10px]">
                  <th className="py-2">Raw Pahani Term</th>
                  <th className="py-2">Canonical Code</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Mapped By</th>
                  <th className="py-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {tenureTerms.map((term, i) => (
                  <tr key={i} className="hover:bg-stone-50">
                    <td className="py-2 font-bold text-stone-800">{term.raw_term}</td>
                    <td className="py-2">
                      <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-[11px] text-stone-700">
                        {term.canonical_code}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        term.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {term.status}
                      </span>
                    </td>
                    <td className="py-2 text-stone-600">{term.mapped_by}</td>
                    <td className="py-2 text-right text-stone-400">{term.mapped_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Evidence Tier Progression (Maker-Checker Enforced) */}
      {activeSubTab === 'tiers' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-stone-900">{t.reviewer.tier_change}</h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Enforces Section 5.2 & 8: A tier change requires a Maker to propose and a different Checker to approve.
            </p>
          </div>

          {tierError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{tierError}</span>
            </div>
          )}

          {tierSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{tierSuccess}</span>
            </div>
          )}

          {/* Maker Proposal Form */}
          <form onSubmit={handleProposeTierChange} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 text-xs">
            <h4 className="font-bold text-stone-800">Propose New Tier Change (Maker Action)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Target Parcel *</label>
                <select
                  value={proposeParcelId}
                  onChange={(e) => setProposeParcelId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="par-45">Survey 45/1 (Current: T1)</option>
                  <option value="par-88">Survey 88 (Current: T1)</option>
                  <option value="par-12">Survey 12 (Current: T1)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Proposed Evidence Tier *</label>
                <select
                  value={proposeToTier}
                  onChange={(e) => setProposeToTier(e.target.value as EvidenceTier)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="T1_RECORD_OBSERVATION">T1_RECORD_OBSERVATION</option>
                  <option value="T2_OFFICE_ASKED">T2_OFFICE_ASKED</option>
                  <option value="T3_OFFICIAL_OUTCOME">T3_OFFICIAL_OUTCOME</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Mandatory Maker Justification *</label>
              <textarea
                rows={2}
                required
                value={proposeJustification}
                onChange={(e) => setProposeJustification(e.target.value)}
                placeholder="Specify factual basis (e.g. proof of verification request dispatched to Tahsildar)..."
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-900 cursor-pointer"
            >
              Submit Proposal
            </button>
          </form>

          {/* Pending Tier Proposals (Checker Action) */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-800 text-xs">Tier Change Requests Log</h4>
            <div className="space-y-2">
              {tierRequests.map((req) => (
                <div key={req.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">
                        Sy {req.survey_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 text-stone-800">
                        {req.from_tier} &rarr; {req.to_tier}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-stone-600 mt-1"><strong>Justification:</strong> {req.justification}</p>
                    <p className="text-stone-500 text-[10px] mt-0.5">
                      Maker: {req.maker_name} | Checker: {req.checker_name || 'Pending independent reviewer'}
                    </p>
                  </div>

                  {req.status === 'PROPOSED' && (
                    <button
                      onClick={() => handleApproveTierChange(req.id)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold text-xs shrink-0 cursor-pointer"
                    >
                      Approve as Checker &rarr;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: RTI & Verification Memo Generator */}
      {activeSubTab === 'templates' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {lang === 'kn' ? 'ಮಾಹಿತಿ ಹಕ್ಕು (RTI) ಮತ್ತು ಪರಿಶೀಲನಾ ಮನವಿ ಪತ್ರ ಜನರೇಟರ್' : 'Neutral RTI Application & Verification Memorandum'}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Strict Section 2 & 10 compliance: zero accusatory words, neutral language, and citations grounded in confirmed legal facts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>

          {/* Generator Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Document Type</label>
              <select
                value={templateType}
                onChange={(e) => {
                  setTemplateType(e.target.value as any);
                }}
                className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg"
              >
                <option value="RTI">RTI Application (Sec 6(1))</option>
                <option value="VERIFICATION">Verification Request Memo</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">Language</label>
              <select
                value={templateLang}
                onChange={(e) => setTemplateLang(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg"
              >
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">Survey No.</label>
              <input
                type="text"
                value={surveyNum}
                onChange={(e) => setSurveyNum(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generateTemplate}
                className="w-full py-1.5 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-900 cursor-pointer"
              >
                Update Preview
              </button>
            </div>
          </div>

          {/* Rendered Document Box */}
          <div className="bg-stone-50 rounded-xl p-5 border border-stone-300 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto select-all text-stone-900">
            {generatedDocText}
          </div>
        </div>
      )}
    </div>
  );
};
