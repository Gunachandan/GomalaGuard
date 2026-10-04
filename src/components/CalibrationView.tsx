import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { CalibrationService, CalibrationSummary } from '../services/calibrationService';
import { ExtentService } from '../services/extentService';
import goldenDataset from '../../tests/golden/kallur_village/parcels.json';
import { 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Play, 
  ShieldCheck, 
  HelpCircle,
  BarChart3
} from 'lucide-react';

interface CalibrationViewProps {
  lang: Language;
  tolAbs: number;
  setTolAbs: (val: number) => void;
  tolRelBp: number;
  setTolRelBp: (val: number) => void;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({
  lang,
  tolAbs,
  setTolAbs,
  tolRelBp,
  setTolRelBp,
}) => {
  const [summary, setSummary] = useState<CalibrationSummary | null>(null);
  const [running, setRunning] = useState(false);

  const runCalibrate = (absVal = tolAbs, relVal = tolRelBp) => {
    setRunning(true);
    setTimeout(() => {
      const res = CalibrationService.runCalibration(
        goldenDataset.test_parcels as any,
        goldenDataset.village_code,
        goldenDataset.village_name_en,
        absVal,
        relVal
      );
      setSummary(res);
      setRunning(false);
    }, 200);
  };

  useEffect(() => {
    runCalibrate();
  }, []);

  const handleApplyRecommended = () => {
    if (summary?.suggestedTolerance) {
      setTolAbs(summary.suggestedTolerance.tolAbsAnas);
      setTolRelBp(summary.suggestedTolerance.tolRelBp);
      runCalibrate(summary.suggestedTolerance.tolAbsAnas, summary.suggestedTolerance.tolRelBp);
    }
  };

  const handleResetDefaults = () => {
    setTolAbs(0);
    setTolRelBp(0);
    runCalibrate(0, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Golden Set & Tolerance Calibration</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            {lang === 'kn' ? 'ಗ್ರಾಮ ಗೋಲ್ಡನ್ ಸೆಟ್ ಕ್ಯಾಲಿಬ್ರೇಶನ್ ಪರೀಕ್ಷೆ' : 'Village Golden Set Calibration Engine'}
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 max-w-3xl leading-relaxed">
            Runs versioned rule logic (R1, R2, R3) against pilot village hand-verified parcels.
          </p>
        </div>

        <button
          onClick={() => runCalibrate()}
          disabled={running}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors shrink-0"
        >
          <Play className="w-4 h-4" />
          {running ? 'Running Suite...' : 'Re-run Calibration'}
        </button>
      </div>

      {/* Mandatory Disclaimer Box per Section 9 of Master Prompt */}
      <div className="bg-amber-500/10 border border-amber-300 rounded-xl p-4 text-xs text-amber-950 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Non-negotiable System Principle:</strong> A passing golden set shows the rules behave as specified on known cases; it does <strong>not</strong> prove any particular parcel was entered correctly (double entry does that).
        </p>
      </div>

      {/* Tolerance Tuner Controls */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
        <h3 className="font-bold text-stone-900 text-sm">
          {lang === 'kn' ? 'ವಿಸ್ತೀರ್ಣ ಸಿಸ್ಟಮ್ ಟಾಲರೆನ್ಸ್ ನಿಯಂತ್ರಣ' : 'System Extent Tolerance Parameters'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-stone-700">TOL_ABS_ANAS (Absolute Anas Tolerance)</label>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-300">
                {tolAbs} anas ({ExtentService.format(tolAbs)})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={tolAbs}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setTolAbs(val);
                runCalibrate(val, tolRelBp);
              }}
              className="w-full accent-emerald-800 cursor-pointer"
            />
            <p className="text-[11px] text-stone-500">
              Integer tolerance added directly to parent parcel extent (0 to 32 anas / 2 guntas).
            </p>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-stone-700">TOL_REL_BP (Relative Basis Points Tolerance)</label>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-300">
                {tolRelBp} bp ({(tolRelBp / 100).toFixed(2)}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={tolRelBp}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setTolRelBp(val);
                runCalibrate(tolAbs, val);
              }}
              className="w-full accent-emerald-800 cursor-pointer"
            />
            <p className="text-[11px] text-stone-500">
              Calculates <code>ceil(parent_anas * TOL_REL_BP / 10000)</code>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyRecommended}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold cursor-pointer"
            >
              Apply Recommended Pilot Tolerance (4 Anas, 25 BP)
            </button>
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-semibold cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset to Default (0, 0)
            </button>
          </div>

          <span className="text-[11px] text-stone-500">
            Formula: <code>tolerance_anas = max(TOL_ABS, ceil(parent * TOL_REL / 10000))</code>
          </span>
        </div>
      </div>

      {/* Calibration Results Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Overall Golden Pass</span>
            <div className="mt-3 flex items-center gap-3">
              {summary.overallPassed ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Passed (100%)</h3>
                    <p className="text-xs text-emerald-800">{summary.passedCount} test cases validated</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-10 h-10 text-rose-600" />
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">{summary.mismatchCount} Mismatch(es)</h3>
                    <p className="text-xs text-rose-800">Rule outputs differ from expected</p>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
              Village Dataset: {summary.villageName} ({summary.villageCode})
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-emerald-800" />
              <h4 className="font-bold text-stone-900 text-sm">Rule Outcomes Breakdown</h4>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-800 block mb-1">R1 (Sub-division)</span>
                <div className="space-y-0.5 text-[11px] text-stone-600">
                  <div>Consistent: {summary.ruleStats.R1.consistent}</div>
                  <div>Contradicted: {summary.ruleStats.R1.contradicted}</div>
                  <div>Not Checkable: {summary.ruleStats.R1.not_checkable}</div>
                  <div>Not Applicable: {summary.ruleStats.R1.not_applicable}</div>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-800 block mb-1">R2 (Tenure Change)</span>
                <div className="space-y-0.5 text-[11px] text-stone-600">
                  <div>Consistent: {summary.ruleStats.R2.consistent}</div>
                  <div>Change Observed: {summary.ruleStats.R2.change_observed}</div>
                  <div>Contradicted: {summary.ruleStats.R2.contradicted}</div>
                  <div>Not Checkable: {summary.ruleStats.R2.not_checkable}</div>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-800 block mb-1">R3 (Mutation Ref)</span>
                <div className="space-y-0.5 text-[11px] text-stone-600">
                  <div>Consistent: {summary.ruleStats.R3.consistent}</div>
                  <div>Change Observed: {summary.ruleStats.R3.change_observed}</div>
                  <div>Not Checkable: {summary.ruleStats.R3.not_checkable}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
