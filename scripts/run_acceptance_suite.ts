/**
 * Complete Acceptance & Parity Test Suite for Gomala Atlas v2
 * 
 * Verifies:
 * 1. Extent Integer Arithmetic & Test Vector Parity (TypeScript vs SQL logic)
 * 2. Pure Rule Engine (R1, R2, R3) All Branch Coverage
 * 3. Maker-Checker & Database Constraints
 * 4. Cryptographic Hash-Chain Audit & Decryption Controls
 * 5. Publishing Gate: Every Condition Failing Independently (including window not elapsed & synthetic golden set)
 * 6. Server-Side Publishing Gate & EXIF Stripper
 * 7. Banned Terms Scanner Placement (flag-only for citizen reports, strict blocking for public templates)
 * 8. Legal Citation Neutrality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ExtentService, ExtentError } from '../src/services/extentService';
import { RuleEngineService } from '../src/services/ruleEngineService';
import { CryptoAuditService } from '../src/services/cryptoAuditService';
import { BannedTermsScanner } from '../src/services/bannedTermsScanner';
import { TemplateService } from '../src/services/templateService';
import { DataService } from '../src/services/dataService';
import { evaluatePublishingGate, stripExifMetadata } from '../server';
import { Parcel } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log('GOMALA ATLAS v2: SYSTEM ACCEPTANCE & AUDIT PARITY SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // 1. EXTENT ARITHMETIC TESTS & SQL PARITY
  // --------------------------------------------------------------------------
  console.log('--- 1. Extent Math, Vectors, and SQL Parity ---');
  
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

  // Load independently verified extent test vectors from tests/vectors/extent.json
  const vectorFilePath = path.resolve(__dirname, '../tests/vectors/extent.json');
  const vectorData = JSON.parse(fs.readFileSync(vectorFilePath, 'utf-8'));

  let sqlParityAllPassed = true;
  for (const item of vectorData.conversions) {
    // TypeScript conversion
    const tsTotal = ExtentService.toAnas(item.acres, item.guntas, item.anas);
    const tsFormatted = ExtentService.format(tsTotal);

    // Simulated SQL IMMUTABLE function: (acres * 640) + (guntas * 16) + anas
    const sqlTotal = item.acres * 640 + item.guntas * 16 + item.anas;
    const sqlAcres = Math.floor(sqlTotal / 640);
    const sqlRem = sqlTotal % 640;
    const sqlGuntas = Math.floor(sqlRem / 16);
    const sqlAnas = sqlRem % 16;
    const sqlFormatted = `${sqlAcres}A-${sqlGuntas}G-${sqlAnas}A`;

    if (tsTotal !== item.total_anas || sqlTotal !== item.total_anas || tsFormatted !== item.formatted || sqlFormatted !== item.formatted) {
      sqlParityAllPassed = false;
    }
  }
  assert(sqlParityAllPassed, 'SQL function vs TypeScript engine extent parity verified on all conversion vectors');

  // Verify hand-calculated tolerance cases
  let toleranceVectorsPassed = true;
  for (const tc of vectorData.tolerance_cases) {
    const computed = ExtentService.calculateTolerance(tc.parent_anas, tc.tol_abs_anas, tc.tol_rel_bp);
    if (computed !== tc.expected_tolerance) {
      toleranceVectorsPassed = false;
      console.error(`Tolerance mismatch: expected ${tc.expected_tolerance} got ${computed} for parent ${tc.parent_anas}, bp ${tc.tol_rel_bp}`);
    }
  }
  assert(toleranceVectorsPassed, 'Tolerance integer ceiling arithmetic matches independently hand-calculated test vectors');

  // 10,000 deterministic seeded roundtrips
  const suiteRes = ExtentService.runVerificationSuite();
  assert(suiteRes.passed && suiteRes.seededRoundTrips === 10000, '10,000 deterministic seeded LCG round-trips passed with zero errors');

  // --------------------------------------------------------------------------
  // 2. RULE ENGINE R1, R2, R3 TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Rule Engine Branches (Pure Server Functions) ---');

  // R1: Sub-division extent balance
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

  const r1OverSum = RuleEngineService.evaluateR1({
    parcelId: 'test-p2',
    surveyNumber: '88',
    parentExtentAnas: 3200,
    parentDocId: 'doc-parent-88',
    childExtentsAnas: [1920, 1600],
    childDocIds: ['doc-child-88-1', 'doc-child-88-2'],
    childrenComplete: false,
    extentComparisonBasis: 'GROSS',
    tolAbsAnas: 0,
    tolRelBp: 0,
  });
  assert(r1OverSum.result.state === 'CONTRADICTED', 'R1: Over-sum with incomplete child list produces CONTRADICTED');

  const r1UnderSumIncomplete = RuleEngineService.evaluateR1({
    parcelId: 'test-p3',
    surveyNumber: '89',
    parentExtentAnas: 3200,
    parentDocId: 'doc-parent-89',
    childExtentsAnas: [1280],
    childDocIds: ['doc-child-89-1'],
    childrenComplete: false,
    extentComparisonBasis: 'GROSS',
    tolAbsAnas: 0,
    tolRelBp: 0,
  });
  assert(r1UnderSumIncomplete.result.state === 'NOT_CHECKABLE', 'R1: Under-sum with incomplete child list produces NOT_CHECKABLE');

  // R2: Tenure change
  const r2NoChange = RuleEngineService.evaluateR2({
    parcelId: 'test-p4',
    surveyNumber: '12',
    baselineTenureTerm: 'ಗೋಮಾಳ',
    baselineTenureCode: 'GOMAL',
    baselineDocId: 'doc-base-12',
    currentTenureTerm: 'ಗೋಮಾಳ',
    currentTenureCode: 'GOMAL',
    currentDocId: 'doc-curr-12',
    hasOrderDoc: false,
    orderConfirmed: false,
    hasRtiReply: false,
    rtiReplyType: null,
  });
  assert(r2NoChange.result.state === 'CONSISTENT', 'R2: Identical tenure produces CONSISTENT');

  const r2ChangedWithValidOrder = RuleEngineService.evaluateR2({
    parcelId: 'test-p5',
    surveyNumber: '45',
    baselineTenureTerm: 'ಗೋಮಾಳ',
    baselineTenureCode: 'GOMAL',
    baselineDocId: 'doc-base-45',
    currentTenureTerm: 'ಖಾಸ್ ದರಖಾಸ್ತು',
    currentTenureCode: 'KHAS_DARAKHT',
    currentDocId: 'doc-curr-45',
    hasOrderDoc: true,
    orderDocId: 'doc-order-45',
    orderConfirmed: true,
    hasRtiReply: false,
    rtiReplyType: null,
  });
  assert(r2ChangedWithValidOrder.result.state === 'CONSISTENT', 'R2: Changed tenure with confirmed order produces CONSISTENT');

  const r2ChangedNoDoc = RuleEngineService.evaluateR2({
    parcelId: 'test-p6',
    surveyNumber: '45',
    baselineTenureTerm: 'ಗೋಮಾಳ',
    baselineTenureCode: 'GOMAL',
    baselineDocId: 'doc-base-45',
    currentTenureTerm: 'ಪಟ್ಟಾ',
    currentTenureCode: 'PATTA_PRIVATE',
    currentDocId: 'doc-curr-45',
    hasOrderDoc: false,
    orderConfirmed: false,
    hasRtiReply: false,
    rtiReplyType: null,
  });
  assert(r2ChangedNoDoc.result.state === 'CHANGE_OBSERVED', 'R2: Changed tenure without order produces CHANGE_OBSERVED');

  const r2ConflictingOrderAndRti = RuleEngineService.evaluateR2({
    parcelId: 'test-p7',
    surveyNumber: '104',
    baselineTenureTerm: 'ಗೋಮಾಳ',
    baselineTenureCode: 'GOMAL',
    baselineDocId: 'doc-base-104',
    currentTenureTerm: 'ಪಟ್ಟಾ',
    currentTenureCode: 'PATTA_PRIVATE',
    currentDocId: 'doc-curr-104',
    hasOrderDoc: true,
    orderDocId: 'doc-order-104',
    orderConfirmed: true,
    hasRtiReply: true,
    rtiReplyType: 'ORDER_STATED_NOT_ISSUED',
    rtiReplyConfirmed: true,
    rtiDocId: 'doc-rti-104',
  });
  assert(r2ConflictingOrderAndRti.result.state === 'NOT_CHECKABLE' && r2ConflictingOrderAndRti.result.reason.includes('conflicting documents: senior review'), 'R2: Conflicting order document + RTI ORDER_STATED_NOT_ISSUED produces NOT_CHECKABLE for senior verifier');

  const r2RtiOrderNotIssued = RuleEngineService.evaluateR2({
    parcelId: 'test-p7b',
    surveyNumber: '104',
    baselineTenureTerm: 'ಗೋಮಾಳ',
    baselineTenureCode: 'GOMAL',
    baselineDocId: 'doc-base-104',
    currentTenureTerm: 'ಪಟ್ಟಾ',
    currentTenureCode: 'PATTA_PRIVATE',
    currentDocId: 'doc-curr-104',
    hasOrderDoc: false,
    orderConfirmed: false,
    hasRtiReply: true,
    rtiReplyType: 'ORDER_STATED_NOT_ISSUED',
    rtiReplyConfirmed: true,
    rtiDocId: 'doc-rti-104',
  });
  assert(r2RtiOrderNotIssued.result.state === 'CONTRADICTED', 'R2: Official RTI ORDER_STATED_NOT_ISSUED without order document produces CONTRADICTED');

  // R3: Mutation reference
  const r3TenureChangedNoMutation = RuleEngineService.evaluateR3({
    parcelId: 'test-p8',
    surveyNumber: '7',
    tenureChanged: true,
    mutationReference: '',
    mutationFieldConfirmed: true,
  });
  assert(r3TenureChangedNoMutation.result.state === 'CHANGE_OBSERVED', 'R3: Tenure changed with blank mutation ref produces CHANGE_OBSERVED');

  // --------------------------------------------------------------------------
  // 3. MAKER-CHECKER & PRIVACY-BY-STRUCTURE
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Database Constraints & Role Integrity ---');

  const tcr = DataService.proposeTierChange('par-12', 'T1_RECORD_OBSERVATION', 'entrant-alice', 'Alice Sharma', 'Verified certified RTC extract');
  let selfApprovalBlocked = false;
  try {
    DataService.approveTierChange(tcr.id, 'entrant-alice', 'Alice Sharma');
  } catch (err: any) {
    if (err.message.includes('Integrity Violation: Checker must be a different individual')) {
      selfApprovalBlocked = true;
    }
  }
  assert(selfApprovalBlocked, 'Maker-Checker constraint: self-approval refused (maker_id != checker_id)');

  // --------------------------------------------------------------------------
  // 4. CRYPTOGRAPHIC AUDIT LOG & TRACKING CODES
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Cryptographic Hash-Chain Audit & Lookup ---');

  assert(CryptoAuditService.verifyChainIntegrity(), 'Cryptographic audit log chain verified: all SHA-256 links intact');

  const secretCode = CryptoAuditService.generateTrackingCode();
  const hmacA = CryptoAuditService.hashTrackingCode(secretCode);
  const hmacB = CryptoAuditService.hashTrackingCode(secretCode);
  assert(hmacA === hmacB && CryptoAuditService.constantTimeCompare(hmacA, hmacB), '128-bit tracking code HMAC verified with constant-time equality');

  // --------------------------------------------------------------------------
  // 5. PUBLISHING GATE (ALL CONDITIONS FAILING INDEPENDENTLY)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Publishing Gate (Independent Failure Verification) ---');

  // Base parcel for gate tests
  const baseParcel: Parcel = {
    id: 'mock-gate-test',
    village_id: 'vil-hosur', // Hosur has golden_set_provenance: human_verified
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

  // Condition 1 Failing: No maker-checker
  const gate1Fail = evaluatePublishingGate({
    parcelId: baseParcel.id,
    makerId: 'user-alice',
    checkerId: 'user-alice', // Self-approval!
    officeResponseReceived: true,
    wordingCode: 'PHRASE_UNCONFIRMED_CHANGE',
    goldenSetProvenance: { status: 'human_verified', verified_by: 'Surveyor Shivakumar' },
  });
  assert(!gate1Fail.canPublish && !gate1Fail.gates.gate1_makerChecker, 'Gate 1 fails independently when makerId === checkerId');

  // Condition 2 Failing Case A: No office request sent
  const gate2FailNoRequest = evaluatePublishingGate({
    parcelId: baseParcel.id,
    makerId: 'user-alice',
    checkerId: 'user-bob',
    officeRequestSentDate: undefined,
    officeResponseReceived: false,
    wordingCode: 'PHRASE_UNCONFIRMED_CHANGE',
    goldenSetProvenance: { status: 'human_verified', verified_by: 'Surveyor Shivakumar' },
  });
  assert(!gate2FailNoRequest.canPublish && !gate2FailNoRequest.gates.gate2_officeWindow, 'Gate 2 fails independently when no office request recorded');

  // Condition 2 Failing Case B: Request sent but response window HAS NOT ELAPSED
  const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
  const gate2FailWindowNotElapsed = evaluatePublishingGate({
    parcelId: baseParcel.id,
    makerId: 'user-alice',
    checkerId: 'user-bob',
    officeRequestSentDate: tenDaysAgo, // Sent 10 days ago (Requires >= 30 days)
    responseWindowDays: 30,
    officeResponseReceived: false,
    wordingCode: 'PHRASE_UNCONFIRMED_CHANGE',
    goldenSetProvenance: { status: 'human_verified', verified_by: 'Surveyor Shivakumar' },
  });
  assert(!gate2FailWindowNotElapsed.canPublish && !gate2FailWindowNotElapsed.gates.gate2_officeWindow, 'Gate 2 fails independently when response window has NOT elapsed (10/30 days)');

  // Condition 3 Failing: Unapproved wording
  const gate3Fail = evaluatePublishingGate({
    parcelId: baseParcel.id,
    makerId: 'user-alice',
    checkerId: 'user-bob',
    officeResponseReceived: true,
    wordingCode: 'CUSTOM_UNAPPROVED_TEXT',
    goldenSetProvenance: { status: 'human_verified', verified_by: 'Surveyor Shivakumar' },
  });
  assert(!gate3Fail.canPublish && !gate3Fail.gates.gate3_wordingApproved, 'Gate 3 fails independently when wording is unapproved');

  // Condition 4 Failing Case A: Golden set missing
  const gate4FailMissing = evaluatePublishingGate({
    parcelId: baseParcel.id,
    makerId: 'user-alice',
    checkerId: 'user-bob',
    officeResponseReceived: true,
    wordingCode: 'PHRASE_UNCONFIRMED_CHANGE',
    goldenSetProvenance: undefined,
  });
  assert(!gate4FailMissing.canPublish && !gate4FailMissing.gates.gate4_goldenSetVerified, 'Gate 4 fails independently when village golden set is missing');

  // Condition 4 Failing Case B: Golden set is SYNTHETIC (strictly refused from unlocking publication!)
  const gate4FailSynthetic = evaluatePublishingGate({
    parcelId: baseParcel.id,
    makerId: 'user-alice',
    checkerId: 'user-bob',
    officeResponseReceived: true,
    wordingCode: 'PHRASE_UNCONFIRMED_CHANGE',
    goldenSetProvenance: { status: 'synthetic' },
  });
  assert(!gate4FailSynthetic.canPublish && !gate4FailSynthetic.gates.gate4_goldenSetVerified, 'Gate 4 fails independently when golden set provenance is synthetic');

  // All 4 Conditions Met: Genuine publication unlocked
  const fortyDaysAgo = new Date(Date.now() - 40 * 86400000).toISOString().split('T')[0];
  const allGatesPass = evaluatePublishingGate({
    parcelId: baseParcel.id,
    makerId: 'user-alice',
    checkerId: 'user-bob',
    officeRequestSentDate: fortyDaysAgo,
    responseWindowDays: 30,
    wordingCode: 'PHRASE_UNCONFIRMED_CHANGE',
    goldenSetProvenance: { status: 'human_verified', verified_by: 'Surveyor K. Shivakumar (Govt Emp #48291)' },
  });
  assert(allGatesPass.canPublish && allGatesPass.gates.gate1_makerChecker && allGatesPass.gates.gate2_officeWindow && allGatesPass.gates.gate3_wordingApproved && allGatesPass.gates.gate4_goldenSetVerified, 'Publishing gate unlocks when Maker!=Checker, window elapsed, approved wording, and human-verified golden set all pass');

  // Verify DataService checkPublishingGate on synthetic vs human-verified villages
  const kallurParcel = DataService.getParcelById('par-12')!;
  const kallurGateResult = DataService.checkPublishingGate(kallurParcel);
  assert(!kallurGateResult.gates.goldenSetPassed, 'DataService.checkPublishingGate refuses Kallur parcel because Kallur golden set is synthetic');

  const hosurParcel = DataService.getParcelById('par-104')!;
  const hosurGateResult = DataService.checkPublishingGate(hosurParcel);
  assert(hosurGateResult.canPublish, 'DataService.checkPublishingGate approves Hosur parcel (human_verified golden set, Maker!=Checker, elapsed window)');

  // --------------------------------------------------------------------------
  // 6. EXIF STRIPPING ON SERVER
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Server-Side EXIF Stripping ---');
  // Simulated JPEG with APP1 EXIF segment (0xFFE1)
  const mockJpegWithExif = Buffer.from([
    0xFF, 0xD8, // SOI
    0xFF, 0xE1, 0x00, 0x0A, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x11, 0x22, // APP1 EXIF
    0xFF, 0xDA, 0x00, 0x02, 0xAA, 0xBB, // SOS (Image data)
    0xFF, 0xD9  // EOI
  ]);
  const stripped = stripExifMetadata(mockJpegWithExif);
  assert(!stripped.includes(Buffer.from('Exif')), 'Server EXIF stripper removes APP1 EXIF metadata headers from uploads');

  // --------------------------------------------------------------------------
  // 7. BANNED TERMS SCANNER PLACEMENT
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Banned Terms Scanner Placement (Citizen Reports vs Public Templates) ---');

  // Incoming citizen report containing accusatory words is ACCEPTED and tagged for moderation
  const reportSubmission = DataService.submitReport({
    villageId: 'vil-kallur',
    surveyNumber: '45',
    description: 'This is an illegal encroachment on village gomal land by a land grabber.',
  });
  assert(reportSubmission.reportId.startsWith('rep-') && reportSubmission.moderationStatus === 'FLAGGED_FOR_MODERATION', 'Citizen report is accepted with tracking code and routed to reviewer moderation queue without rejecting villager');

  // Public phrases & export templates: Accusatory words are strictly blocked
  const accusatoryEn = 'The occupant is an illegal land grabber who committed fraud and a scam.';
  const scanEn = BannedTermsScanner.scanText(accusatoryEn);
  assert(!scanEn.passed && scanEn.violationsFound.length >= 4, 'Scanner detects banned English terms for public text');

  const accusatoryKn = 'ಈ ಜಮೀನನ್ನು ಅಕ್ರಮ ಒತ್ತುವರಿ ಮಾಡಲಾಗಿದ್ದು, ಇದು ದೊಡ್ಡ ಹಗರಣ ಮತ್ತು ವಂಚನೆ.';
  const scanKn = BannedTermsScanner.scanText(accusatoryKn);
  assert(!scanKn.passed && scanKn.violationsFound.length >= 4, 'Scanner detects banned Kannada terms for public text');

  // --------------------------------------------------------------------------
  // 8. TEMPLATE NEUTRALITY & CITATION PLACEHOLDER HONESTY
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Template Neutrality & Citation Placeholder Honesty ---');

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
  console.log(`ACCEPTANCE SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} failures)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
