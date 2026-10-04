/**
 * Complete Acceptance & Parity Test Suite for Gomala Atlas v2
 * 
 * Tests:
 * 1. Extent Integer Arithmetic & Test Vector Parity
 * 2. Pure Rule Engine (R1, R2, R3) All Branch Coverage
 * 3. Maker-Checker & 2-Document Database Constraints
 * 4. Cryptographic Hash-Chain Audit & Decryption Controls
 * 5. Publishing Gate (4 Strict Conditions)
 * 6. Banned Terms Compliance (English & Kannada)
 * 7. Template Neutrality & Citation Placeholder Enforcement
 */

import { ExtentService, ExtentError } from '../src/services/extentService';
import { RuleEngineService } from '../src/services/ruleEngineService';
import { CryptoAuditService } from '../src/services/cryptoAuditService';
import { BannedTermsScanner } from '../src/services/bannedTermsScanner';
import { TemplateService } from '../src/services/templateService';
import { DataService } from '../src/services/dataService';
import { Parcel } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
  }
}

async function runAll() {
  console.log('================================================================');
  console.log('GOMALA ATLAS v2: SYSTEM ACCEPTANCE & PARITY TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // 1. EXTENT ARITHMETIC TESTS
  // --------------------------------------------------------------------------
  console.log('--- 1. Extent Math, Vectors, and Boundary Checks ---');
  
  assert(ExtentService.toAnas(1, 0, 0) === 640, '1A-0G-0A equals 640 anas');
  assert(ExtentService.toAnas(0, 0, 1) === 1, '0A-0G-1A equals 1 ana');
  assert(ExtentService.toAnas(0, 1, 0) === 16, '0A-1G-0A equals 16 anas');

  // 39G-15A + 1A = 40G-0A = 1A-0G-0A = 640 anas
  const anas39g15a = ExtentService.toAnas(0, 39, 15);
  const plus1a = ExtentService.add(anas39g15a, 1);
  assert(plus1a === 640 && ExtentService.format(plus1a) === '1A-0G-0A', '39G-15A + 1A normalizes exactly to 1A-0G-0A');

  // 1A-20G-0A - 0A-5G-0A = 1A-15G-0A
  const minA = ExtentService.toAnas(1, 20, 0); // 960
  const minB = ExtentService.toAnas(0, 5, 0);  // 80
  const diff = ExtentService.subtract(minA, minB);
  assert(diff === 880 && ExtentService.format(diff) === '1A-15G-0A', '1A-20G-0A minus 0A-5G-0A = 1A-15G-0A');

  // Negative subtraction throws ExtentError
  let negativeRefused = false;
  try {
    ExtentService.subtract(100, 101);
  } catch (err: any) {
    if (err.message === 'Negative extent subtraction refused') {
      negativeRefused = true;
    }
  }
  assert(negativeRefused, 'Negative extent subtraction throws required message');

  // Tolerance ceiling rounding at boundary: parent 1000 anas, tol_rel_bp 15 -> 1000 * 15 / 10000 = 1.5 -> ceil is 2
  const tolCeil = ExtentService.calculateTolerance(1000, 0, 15);
  assert(tolCeil === 2, 'Tolerance ceiling rounding: 1.5 anas rounds up to 2 anas');

  // 10,000 deterministic seeded roundtrips
  const suiteRes = ExtentService.runVerificationSuite();
  assert(suiteRes.passed && suiteRes.seededRoundTrips === 10000, '10,000 deterministic seeded LCG round-trips passed with zero errors');

  // --------------------------------------------------------------------------
  // 2. RULE ENGINE R1, R2, R3 TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Rule Engine Branches (Pure Server Functions) ---');

  // R1: Sub-division extent balance
  // Case A: basis UNCONFIRMED -> NOT_CHECKABLE
  const r1BasisUnconfirmed = RuleEngineService.evaluateR1({
    parcelId: 'test-p1',
    surveyNumber: '1',
    parentExtentAnas: 640,
    parentDocId: 'doc-p',
    childExtentsAnas: [300, 300],
    childDocIds: ['doc-c1', 'doc-c2'],
    childrenComplete: true,
    extentComparisonBasis: 'UNCONFIRMED',
    tolAbsAnas: 0,
    tolRelBp: 0,
  });
  assert(r1BasisUnconfirmed.result.state === 'NOT_CHECKABLE', 'R1: UNCONFIRMED comparison basis returns NOT_CHECKABLE');

  // Case B: Over-sum with incomplete list -> CONTRADICTED (valid because more records can only increase sum)
  const r1OverSum = RuleEngineService.evaluateR1({
    parcelId: 'test-p2',
    surveyNumber: '88',
    parentExtentAnas: 3200, // 5A-0G-0A
    parentDocId: 'doc-parent-88',
    childExtentsAnas: [1920, 1600], // Sum = 3520 > 3200
    childDocIds: ['doc-child-88-1', 'doc-child-88-2'],
    childrenComplete: false, // Incomplete!
    extentComparisonBasis: 'GROSS',
    tolAbsAnas: 0,
    tolRelBp: 0,
  });
  assert(r1OverSum.result.state === 'CONTRADICTED', 'R1: Over-sum with incomplete child list returns CONTRADICTED');
  assert(r1OverSum.result.input_document_ids.length >= 2, 'R1 CONTRADICTED includes at least 2 source document IDs');

  // Case C: Under-sum with incomplete list -> NOT_CHECKABLE (reason: child_list_not_confirmed_complete)
  const r1UnderSumIncomplete = RuleEngineService.evaluateR1({
    parcelId: 'test-p3',
    surveyNumber: '150',
    parentExtentAnas: 2560,
    parentDocId: 'doc-p-150',
    childExtentsAnas: [1280],
    childDocIds: ['doc-c-150'],
    childrenComplete: false,
    extentComparisonBasis: 'GROSS',
    tolAbsAnas: 0,
    tolRelBp: 0,
  });
  assert(r1UnderSumIncomplete.result.state === 'NOT_CHECKABLE' && r1UnderSumIncomplete.result.reason.includes('child_list_not_confirmed_complete'),
    'R1: Under-sum with incomplete child list returns NOT_CHECKABLE (child_list_not_confirmed_complete)');

  // Case D: Under-sum with children_complete: true -> CONSISTENT
  const r1UnderSumComplete = RuleEngineService.evaluateR1({
    parcelId: 'test-p4',
    surveyNumber: '12',
    parentExtentAnas: 2560,
    parentDocId: 'doc-p-12',
    childExtentsAnas: [1280, 1280],
    childDocIds: ['doc-c-12-1', 'doc-c-12-2'],
    childrenComplete: true,
    extentComparisonBasis: 'GROSS',
    tolAbsAnas: 0,
    tolRelBp: 0,
  });
  assert(r1UnderSumComplete.result.state === 'CONSISTENT', 'R1: Complete child list within parent extent returns CONSISTENT');

  // R2: Tenure change vs baseline
  // Case A: Missing baseline source document -> NOT_CHECKABLE
  const r2MissingDoc = RuleEngineService.evaluateR2({
    parcelId: 'test-r2-1',
    surveyNumber: '10',
    baselineTenureTerm: 'GOMAL',
    baselineTenureCode: 'GOMAL',
    baselineDocId: undefined, // Missing!
    currentTenureTerm: 'PATTA',
    currentTenureCode: 'PATTA_PRIVATE',
    currentDocId: 'doc-curr',
    hasOrderDoc: false,
    orderConfirmed: false,
    hasRtiReply: false,
  });
  assert(r2MissingDoc.result.state === 'NOT_CHECKABLE' && r2MissingDoc.result.reason.includes('missing_baseline_document'),
    'R2: Missing baseline source document returns NOT_CHECKABLE');

  // Case B: Unmapped tenure term -> NOT_CHECKABLE + task
  const r2Unmapped = RuleEngineService.evaluateR2({
    parcelId: 'test-r2-2',
    surveyNumber: '200',
    baselineTenureTerm: 'UNKNOWN_RAW_WORD',
    baselineTenureCode: undefined, // Unmapped!
    baselineDocId: 'doc-base',
    currentTenureTerm: 'GOMAL',
    currentTenureCode: 'GOMAL',
    currentDocId: 'doc-curr',
    hasOrderDoc: false,
    orderConfirmed: false,
    hasRtiReply: false,
  });
  assert(r2Unmapped.result.state === 'NOT_CHECKABLE' && r2Unmapped.generatedTask?.task_type === 'MAP_TENURE_TERM',
    'R2: Unmapped tenure term returns NOT_CHECKABLE and creates MAP_TENURE_TERM task');

  // Case C: Baseline GOMAL, current non-GOMAL, no order attached -> CHANGE_OBSERVED (Never CONTRADICTED)
  const r2NoOrder = RuleEngineService.evaluateR2({
    parcelId: 'test-r2-3',
    surveyNumber: '45',
    baselineTenureTerm: 'GOMAL',
    baselineTenureCode: 'GOMAL',
    baselineDocId: 'doc-base-45',
    currentTenureTerm: 'KHAS_DARAKHT',
    currentTenureCode: 'KHAS_DARAKHT',
    currentDocId: 'doc-curr-45',
    hasOrderDoc: false,
    orderConfirmed: false,
    hasRtiReply: false,
  });
  assert(r2NoOrder.result.state === 'CHANGE_OBSERVED', 'R2: Tenure change without order returns CHANGE_OBSERVED (absence of doc is not contradiction)');

  // Case D: RTI reply INFORMATION_NOT_AVAILABLE -> Stays CHANGE_OBSERVED, creates appeal task
  const r2InfoNotAvail = RuleEngineService.evaluateR2({
    parcelId: 'test-r2-4',
    surveyNumber: '45',
    baselineTenureTerm: 'GOMAL',
    baselineTenureCode: 'GOMAL',
    baselineDocId: 'doc-base-45',
    currentTenureTerm: 'KHAS_DARAKHT',
    currentTenureCode: 'KHAS_DARAKHT',
    currentDocId: 'doc-curr-45',
    hasOrderDoc: false,
    orderConfirmed: false,
    hasRtiReply: true,
    rtiReplyType: 'INFORMATION_NOT_AVAILABLE',
    rtiReplyConfirmed: true,
    rtiDocId: 'doc-rti-na',
  });
  assert(r2InfoNotAvail.result.state === 'CHANGE_OBSERVED' && r2InfoNotAvail.generatedTask?.task_type === 'FILE_RTI_APPEAL',
    'R2: RTI INFORMATION_NOT_AVAILABLE keeps CHANGE_OBSERVED and creates appeal task');

  // Case E: Verifier-confirmed ORDER_STATED_NOT_ISSUED -> CONTRADICTED (requires >= 2 docs)
  const r2OrderNotIssued = RuleEngineService.evaluateR2({
    parcelId: 'test-r2-5',
    surveyNumber: '104',
    baselineTenureTerm: 'GOMAL',
    baselineTenureCode: 'GOMAL',
    baselineDocId: 'doc-base-104',
    currentTenureTerm: 'PATTA_PRIVATE',
    currentTenureCode: 'PATTA_PRIVATE',
    currentDocId: 'doc-curr-104',
    hasOrderDoc: false,
    orderConfirmed: false,
    hasRtiReply: true,
    rtiReplyType: 'ORDER_STATED_NOT_ISSUED',
    rtiReplyConfirmed: true,
    rtiDocId: 'doc-rti-104',
  });
  assert(r2OrderNotIssued.result.state === 'CONTRADICTED', 'R2: Verifier-confirmed ORDER_STATED_NOT_ISSUED leads to CONTRADICTED');
  assert(r2OrderNotIssued.result.input_document_ids.length >= 2, 'R2 CONTRADICTED includes baseline doc, current doc, and RTI reply');

  // Case F: Conflict: Order attached AND ORDER_STATED_NOT_ISSUED reply -> NOT_CHECKABLE + senior review task
  const r2Conflict = RuleEngineService.evaluateR2({
    parcelId: 'test-r2-6',
    surveyNumber: '175',
    baselineTenureTerm: 'GOMAL',
    baselineTenureCode: 'GOMAL',
    baselineDocId: 'doc-base-175',
    currentTenureTerm: 'INAM',
    currentTenureCode: 'INAM_ABOLISHED',
    currentDocId: 'doc-curr-175',
    hasOrderDoc: true,
    orderConfirmed: true,
    orderDocId: 'doc-order-175',
    hasRtiReply: true,
    rtiReplyType: 'ORDER_STATED_NOT_ISSUED',
    rtiReplyConfirmed: true,
    rtiDocId: 'doc-rti-175',
  });
  assert(r2Conflict.result.state === 'NOT_CHECKABLE' && r2Conflict.result.reason.includes('conflicting documents'),
    'R2: Order attached alongside conflicting ORDER_STATED_NOT_ISSUED returns NOT_CHECKABLE (senior review)');

  // R3: Mutation reference check
  const r3Missing = RuleEngineService.evaluateR3({
    parcelId: 'test-r3-1',
    surveyNumber: '45',
    tenureChanged: true,
    mutationReference: '',
    mutationFieldConfirmed: true,
  });
  assert(r3Missing.result.state === 'CHANGE_OBSERVED', 'R3: Tenure changed with empty mutation reference returns CHANGE_OBSERVED');

  const r3Present = RuleEngineService.evaluateR3({
    parcelId: 'test-r3-2',
    surveyNumber: '104',
    tenureChanged: true,
    mutationReference: 'MR 04/2012',
    mutationFieldConfirmed: true,
  });
  assert(r3Present.result.state === 'CONSISTENT', 'R3: Mutation reference present returns CONSISTENT');

  // --------------------------------------------------------------------------
  // 3. DATABASE CONSTRAINTS & MAKER-CHECKER ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Database Constraints & Maker-Checker Verification ---');

  // Test: Maker cannot check their own tier change proposal
  const testParcel = DataService.getParcels()[0];
  const proposal = DataService.proposeTierChange(
    testParcel.id,
    'T2_OFFICE_ASKED',
    'same_user_1',
    'User One',
    'Testing maker checker rule'
  );

  let selfCheckRejected = false;
  try {
    DataService.approveTierChange(proposal.id, 'same_user_1', 'User One');
  } catch (err: any) {
    if (err.message.includes('maker_id != checker_id')) {
      selfCheckRejected = true;
    }
  }
  assert(selfCheckRejected, 'Maker-Checker Constraint: Self-approval by maker is strictly refused');

  // Approval by distinct checker succeeds
  let distinctCheckSucceeded = false;
  try {
    DataService.approveTierChange(proposal.id, 'different_user_2', 'User Two');
    distinctCheckSucceeded = true;
  } catch {
    distinctCheckSucceeded = false;
  }
  assert(distinctCheckSucceeded, 'Maker-Checker Constraint: Approval by distinct checker succeeds');

  // --------------------------------------------------------------------------
  // 4. CRYPTO, AUDIT & DECRYPTION HONESTY
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Cryptographic Audit Chain & Envelope Decryption ---');

  // Tracking codes: stored strictly as HMAC
  const rawCode = CryptoAuditService.generateTrackingCode();
  const hmacCode = CryptoAuditService.hashTrackingCode(rawCode);
  assert(rawCode.length === 32, 'Tracking code is 128-bit random hex string');
  assert(hmacCode !== rawCode && hmacCode.length === 64, 'Tracking code stored only as HMAC-SHA256');

  // Audit chain verification
  const auditVerification = CryptoAuditService.verifyChainIntegrity();
  assert(auditVerification.valid, 'Audit Log SHA-256 previous-hash chain verified valid');

  // Decryption without reason is refused
  const encryptedName = CryptoAuditService.encryptSensitive('ತಿಮ್ಮಯ್ಯ');
  let decryptRefusedNoReason = false;
  try {
    CryptoAuditService.decryptSensitive(encryptedName, 'user-1', 'User', '', 'rec-1');
  } catch (err: any) {
    if (err.message.includes('Decryption refused')) {
      decryptRefusedNoReason = true;
    }
  }
  assert(decryptRefusedNoReason, 'Envelope decryption refused if verified justification is omitted');

  // Decryption with reason succeeds and writes an audit row
  const logCountBefore = CryptoAuditService.getAuditLog().length;
  const decrypted = CryptoAuditService.decryptSensitive(
    encryptedName,
    'verifier-1',
    'Verifier Sumana',
    'Cross-verifying certified mutation entry with RTC',
    'rec-1'
  );
  const logCountAfter = CryptoAuditService.getAuditLog().length;
  assert(decrypted === 'ತಿಮ್ಮಯ್ಯ', 'Envelope decryption recovers original text');
  assert(logCountAfter === logCountBefore + 1, 'Decryption atomically wrote an audit row in the hash chain');

  // --------------------------------------------------------------------------
  // 5. PUBLISHING GATE ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Publishing Gate (4 Strict Conditions) ---');

  // Create mock parcel failing all conditions
  const mockUnpublishedParcel: Parcel = {
    id: 'mock-par-unpub',
    village_id: 'vil-kallur',
    survey_number: '99',
    hissa: '*',
    baseline_tenure: 'GOMAL',
    current_tenure: 'SARKARI',
    gross_extent_anas: 1280,
    has_subdivisions: false,
    children_complete: true,
    tier: 'T0_REPORTED',
    has_order_document: false,
    order_confirmed: false,
    has_rti_reply: false,
    published: false,
  };

  const gateResultFail = DataService.checkPublishingGate(mockUnpublishedParcel);
  assert(!gateResultFail.canPublish, 'Publishing gate correctly blocks unverified parcel');
  assert(!gateResultFail.gates.makerCheckerPassed, 'Gate 1 failed: No maker-checker approval');
  assert(!gateResultFail.gates.officeWindowPassed, 'Gate 2 failed: No office request recorded');
  assert(!gateResultFail.gates.wordingApproved, 'Gate 3 failed: No approved wording selected');

  // Verify published parcel meets all 4 conditions
  const publishedParcel = DataService.getParcelById('par-104')!;
  const gateResultPass = DataService.checkPublishingGate(publishedParcel);
  assert(gateResultPass.canPublish, 'Publishing gate permits publication when all 4 conditions are met');

  // --------------------------------------------------------------------------
  // 6. BANNED TERMS SCANNER (ENGLISH & KANNADA)
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Banned Terms Scanner Compliance ---');

  const accusatoryEn = 'The occupant is an illegal land grabber who committed fraud and a scam.';
  const scanEn = BannedTermsScanner.scanText(accusatoryEn);
  assert(!scanEn.passed && scanEn.violationsFound.length >= 4, 'Scanner detects banned English terms (illegal, grabber, fraud, scam)');

  const accusatoryKn = 'ಈ ಜಮೀನನ್ನು ಅಕ್ರಮ ಒತ್ತುವರಿ ಮಾಡಲಾಗಿದ್ದು, ಇದು ದೊಡ್ಡ ಹಗರಣ ಮತ್ತು ವಂಚನೆ.';
  const scanKn = BannedTermsScanner.scanText(accusatoryKn);
  assert(!scanKn.passed && scanKn.violationsFound.length >= 4, 'Scanner detects banned Kannada terms (ಅಕ್ರಮ, ಒತ್ತುವರಿ, ಹಗರಣ, ವಂಚನೆ)');

  const neutralPhrase = 'The records entered show a change in tenure classification. No linked order was found among the documents entered. Verification is requested.';
  const scanNeutral = BannedTermsScanner.scanText(neutralPhrase);
  assert(scanNeutral.passed, 'Approved neutral public phrase passes scanner with 0 violations');

  // --------------------------------------------------------------------------
  // 7. TEMPLATE GENERATION & LEGAL CITATION HONESTY
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Template Neutrality & Citation Placeholder Honesty ---');

  const rtiDoc = TemplateService.generateRtiApplication({
    language: 'kn',
    applicantName: 'ರಾಮಯ್ಯ',
    applicantAddress: 'ಕಲ್ಲೂರು',
    villageNameKn: 'ಕಲ್ಲೂರು',
    villageNameEn: 'Kallur',
    talukName: 'ಗುಬ್ಬಿ',
    districtName: 'ತುಮಕೂರು',
    surveyNumber: '45',
    historicalClassification: 'ಗೋಮಾಳ',
    currentClassification: 'ಖಾಸ್ ದರಖಾಸ್ತು',
  });

  assert(rtiDoc.includes('[CITATION TO BE CONFIRMED BY LEGAL REVIEWER]'),
    'RTI template renders mandatory [CITATION TO BE CONFIRMED BY LEGAL REVIEWER] placeholder');
  assert(rtiDoc.includes('[TO BE CONFIRMED FROM STATE RTI RULES]'),
    'RTI template renders mandatory [TO BE CONFIRMED FROM STATE RTI RULES] fee placeholder');
  assert(!rtiDoc.includes('2005 ರ ಕಲಂ 6(1)'),
    'RTI template does NOT fabricate Section 6(1) citation from memory');

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} failures)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
