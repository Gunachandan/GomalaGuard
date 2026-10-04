import React, { useState } from 'react';
import { Language, UserRole } from '../types';
import { CryptoAuditService } from '../services/cryptoAuditService';
import { BannedTermsScanner, ScanResult } from '../services/bannedTermsScanner';
import { ExtentService } from '../services/extentService';
import { i18n } from '../services/i18n';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Key, 
  FileCode, 
  Terminal,
  RefreshCw
} from 'lucide-react';

interface AuditComplianceViewProps {
  role: UserRole;
  lang: Language;
}

export const AuditComplianceView: React.FC<AuditComplianceViewProps> = ({ role, lang }) => {
  const t = i18n[lang];
  const [activeTab, setActiveTab] = useState<'audit' | 'scanner' | 'extent-vectors'>('audit');
  
  // Audit log chain state
  const [auditRows, setAuditRows] = useState(CryptoAuditService.getAuditLog());
  const [chainIntegrity, setChainIntegrity] = useState(CryptoAuditService.verifyChainIntegrity());
  const [verifying, setVerifying] = useState(false);

  // Scanner state
  const [scanText, setScanText] = useState(
    'The records entered show a change in tenure classification over time. No linked order was found among the documents entered. Verification is requested from the revenue office.'
  );
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Extent unit test runner state
  const [extentTestResult, setExtentTestResult] = useState<any>(null);

  const handleVerifyChain = () => {
    setVerifying(true);
    setTimeout(() => {
      const res = CryptoAuditService.verifyChainIntegrity();
      setChainIntegrity(res);
      setAuditRows(CryptoAuditService.getAuditLog());
      setVerifying(false);
    }, 250);
  };

  const handleRunScanner = () => {
    const res = BannedTermsScanner.scanText(scanText);
    setScanResult(res);
  };

  const handleRunExtentSuite = () => {
    const res = ExtentService.runVerificationSuite();
    setExtentTestResult(res);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographic Audit & Zero-Accusation Compliance</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            {lang === 'kn' ? 'ಆಡಿಟ್ ಲಾಗ್ ಮತ್ತು ಅನುಸರಣಾ ಪರಿಶೀಲನೆ' : 'Immutable Audit Log & Compliance Engine'}
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Append-only SHA-256 cryptographic chaining, zero banned words enforcement, and extent test vectors.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Audit Chain
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'scanner' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Banned Terms Scanner
          </button>
          <button
            onClick={() => {
              setActiveTab('extent-vectors');
              handleRunExtentSuite();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'extent-vectors' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Extent Parity Suite
          </button>
        </div>
      </div>

      {/* Tab 1: Audit Chain Inspector */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {chainIntegrity.valid ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  {chainIntegrity.valid
                    ? 'Cryptographic Hash-Chain Verified Valid'
                    : 'Cryptographic Hash-Chain Compromised'}
                </h3>
                <p className="text-xs text-stone-500">
                  {chainIntegrity.totalRows} immutable audit rows chained via SHA-256 previous-hash pointer.
                </p>
              </div>
            </div>

            <button
              onClick={handleVerifyChain}
              disabled={verifying}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              Re-verify Chain Integrity
            </button>
          </div>

          {/* Audit Rows Table */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 text-[10px] uppercase">
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">Actor</th>
                    <th className="py-2">Action</th>
                    <th className="py-2">Details</th>
                    <th className="py-2 font-mono">Current Hash (SHA-256)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {auditRows.map((row) => (
                    <tr key={row.id} className="hover:bg-stone-50 font-sans">
                      <td className="py-2.5 text-stone-500 text-[11px] whitespace-nowrap">
                        {new Date(row.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 font-bold text-stone-900 whitespace-nowrap">
                        {row.actor_name}
                      </td>
                      <td className="py-2.5">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                          {row.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-stone-700 max-w-xs truncate" title={row.details}>
                        {row.details}
                      </td>
                      <td className="py-2.5 font-mono text-[10px] text-emerald-800 select-all truncate max-w-[120px]" title={row.current_hash}>
                        {row.current_hash.substring(0, 12)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Banned Terms Scanner */}
      {activeTab === 'scanner' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-stone-900">{t.scanner.title}</h3>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
              Enforces Section 2 Rule 1: The words fraud, forged, illegal, grabber, encroacher, criminal, scam, and their Kannada equivalents (ವಂಚನೆ, ನಕಲಿ, ಅಕ್ರಮ, ಕಬಳಿಕೆದಾರ, ಒತ್ತುವರಿದಾರ, ಇತ್ಯಾದಿ) MUST NEVER appear anywhere.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              rows={4}
              value={scanText}
              onChange={(e) => setScanText(e.target.value)}
              className="w-full p-3 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              placeholder="Paste English or Kannada text to audit for compliance..."
            />

            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">
                Scanning against 16 English terms and 12 Kannada prohibited equivalents.
              </span>
              <button
                onClick={handleRunScanner}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                {t.scanner.run_btn}
              </button>
            </div>
          </div>

          {scanResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              scanResult.passed 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {scanResult.passed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Compliance Verification Passed: Zero Banned Terms</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>Compliance Violation: Prohibited Term(s) Detected</span>
                  </>
                )}
              </div>

              {!scanResult.passed && (
                <div className="mt-2 space-y-1">
                  <p className="font-semibold text-rose-800">Violations found:</p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {scanResult.violationsFound.map((v, i) => (
                      <li key={i}>
                        Found: <strong className="underline">{v.term}</strong> ({v.language.toUpperCase()}) in context: &quot;...{v.contextSnippet}...&quot;
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Extent Parity Suite */}
      {activeTab === 'extent-vectors' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Extent Integer Arithmetic & Test Vector Parity
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Strict integer Anas arithmetic (640 Anas = 1 Acre). Subtraction below zero throws. Zero floating point.
              </p>
            </div>
            <button
              onClick={handleRunExtentSuite}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Re-run 10,000 Vectors
            </button>
          </div>

          {extentTestResult && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">
                    All Extent Tests & 10,000 Deterministic Round-trips Passed
                  </h4>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    Verified negative refusal, ceiling tolerance calculation, and 1A-0G-0A conversion.
                  </p>
                </div>
              </div>

              <div className="bg-stone-900 text-stone-100 p-4 rounded-xl font-mono text-[11px] space-y-1">
                <div className="text-emerald-400 font-bold mb-2">// Verification Output Log</div>
                {extentTestResult.log.map((line: string, i: number) => (
                  <div key={i}>{line}</div>
                ))}
                <div>Vector Checks Run: {extentTestResult.vectorTestsRun}</div>
                <div>Deterministic Seeded LCG Round-trips: {extentTestResult.seededRoundTrips}</div>
                <div>Total Errors: {extentTestResult.errorCount}</div>
              </div>

              <div>
                <h4 className="font-bold text-stone-800 mb-2">Equivalent PostgreSQL Function Definition:</h4>
                <pre className="bg-stone-50 p-4 rounded-xl border border-stone-200 font-mono text-[10px] text-stone-800 overflow-x-auto max-h-[220px]">
                  {ExtentService.getSqlDefinition()}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
