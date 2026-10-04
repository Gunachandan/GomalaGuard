/**
 * Data Service and In-Memory Database for Gomala Atlas v2
 * 
 * Manages all entities with database-like constraints, audit logging,
 * and maker-checker validation.
 */

import {
  Village,
  Parcel,
  DocumentRecord,
  RecordEntry,
  Task,
  TierChangeRequest,
  OfficeRequest,
  RuleResult,
  CitizenReport,
  TenureTermMapping,
  EvidenceTier,
  RtiReplyType,
} from '../types';
import { CryptoAuditService } from './cryptoAuditService';
import { RuleEngineService } from './ruleEngineService';
import { ExtentService } from './extentService';

export class DataService {
  private static villages: Village[] = [
    {
      id: 'vil-kallur',
      code: '594001',
      name_kn: 'ಕಲ್ಲೂರು',
      name_en: 'Kallur',
      district: 'Tumakuru',
      taluk: 'Gubbi',
      hobli: 'Kasaba',
      total_parcels: 24,
      reported_count: 5,
      reviewed_count: 8,
      golden_set_passed: true,
    },
    {
      id: 'vil-hosur',
      code: '594002',
      name_kn: 'ಹೊಸೂರು',
      name_en: 'Hosur',
      district: 'Tumakuru',
      taluk: 'Gubbi',
      hobli: 'Nittur',
      total_parcels: 18,
      reported_count: 2,
      reviewed_count: 4,
      golden_set_passed: true,
    },
    {
      id: 'vil-kadaba',
      code: '594003',
      name_kn: 'ಕಡಬ',
      name_en: 'Kadaba',
      district: 'Tumakuru',
      taluk: 'Gubbi',
      hobli: 'Chandrashekarapura',
      total_parcels: 31,
      reported_count: 7,
      reviewed_count: 12,
      golden_set_passed: false,
    },
  ];

  private static parcels: Parcel[] = [
    {
      id: 'par-12',
      village_id: 'vil-kallur',
      survey_number: '12',
      hissa: '*',
      baseline_tenure: 'GOMAL',
      current_tenure: 'GOMAL',
      gross_extent_anas: 2560, // 4A-0G-0A
      has_subdivisions: false,
      children_complete: true,
      tier: 'T1_RECORD_OBSERVATION',
      has_order_document: false,
      order_confirmed: false,
      has_rti_reply: false,
      mutation_reference: 'MR 14/1985',
      published: false,
      encrypted_owner_name: CryptoAuditService.encryptSensitive('ಸರ್ಕಾರಿ ಗೋಮಾಳ ಕಾಯ್ದಿರಿಸಿದೆ'),
      coordinates: { x: 30, y: 40, width: 85, height: 70 },
    },
    {
      id: 'par-45',
      village_id: 'vil-kallur',
      survey_number: '45',
      hissa: '1',
      baseline_tenure: 'GOMAL',
      current_tenure: 'KHAS_DARAKHT',
      gross_extent_anas: 1920, // 3A-0G-0A
      has_subdivisions: false,
      children_complete: true,
      tier: 'T1_RECORD_OBSERVATION',
      has_order_document: false,
      order_confirmed: false,
      has_rti_reply: false,
      mutation_reference: '',
      published: false,
      wording_code: 'P1_CHANGE_OBSERVED',
      encrypted_owner_name: CryptoAuditService.encryptSensitive('ತಿಮ್ಮಯ್ಯ ಬಿನ್ ರಾಮಯ್ಯ'),
      coordinates: { x: 130, y: 55, width: 90, height: 75 },
    },
    {
      id: 'par-88',
      village_id: 'vil-kallur',
      survey_number: '88',
      hissa: '*',
      baseline_tenure: 'GOMAL',
      current_tenure: 'GOMAL',
      gross_extent_anas: 3200, // 5A-0G-0A
      has_subdivisions: true,
      children_complete: false,
      tier: 'T1_RECORD_OBSERVATION',
      has_order_document: false,
      order_confirmed: false,
      has_rti_reply: false,
      mutation_reference: 'MR 09/1992',
      published: false,
      wording_code: 'P2_SUBDIVISION_EXTENT_DISCREPANCY',
      encrypted_owner_name: CryptoAuditService.encryptSensitive('ಸಾರ್ವಜನಿಕ ಮೇಯುವ ಜಮೀನು'),
      coordinates: { x: 235, y: 35, width: 105, height: 95 },
    },
    {
      id: 'par-104',
      village_id: 'vil-kallur',
      survey_number: '104',
      hissa: '2',
      baseline_tenure: 'GOMAL',
      current_tenure: 'PATTA_PRIVATE',
      gross_extent_anas: 1280, // 2A-0G-0A
      has_subdivisions: false,
      children_complete: true,
      tier: 'T3_OFFICIAL_OUTCOME',
      has_order_document: false,
      order_confirmed: false,
      has_rti_reply: true,
      rti_reply_type: 'ORDER_STATED_NOT_ISSUED',
      rti_reply_confirmed: true,
      rti_reply_quote: 'ಈ ಕಚೇರಿಯ ಕಡತಗಳ ಪರಿಶೀಲನೆಯಂತೆ ಸದರಿ ಸರ್ವೆ ನಂಬರಿಗೆ ಯಾವುದೇ ಸರ್ಕಾರಿ ಮಂಜೂರಾತಿ ಆದೇಶ ಹೊರಡಿಸಲಾಗಿಲ್ಲ.',
      mutation_reference: 'MR 04/2012',
      published: true, // Meets publishing gate
      wording_code: 'P4_REPLY_STATED_NO_ORDER',
      encrypted_owner_name: CryptoAuditService.encryptSensitive('ಕೃಷ್ಣಮೂರ್ತಿ ಬಿನ್ ವೆಂಕಟಪ್ಪ'),
      coordinates: { x: 50, y: 135, width: 95, height: 80 },
    },
    {
      id: 'par-130',
      village_id: 'vil-kallur',
      survey_number: '130',
      hissa: '*',
      baseline_tenure: 'GOMAL',
      current_tenure: 'PUBLIC_HOSPITAL',
      gross_extent_anas: 6400, // 10A-0G-0A
      has_subdivisions: false,
      children_complete: true,
      tier: 'T3_OFFICIAL_OUTCOME',
      has_order_document: true,
      order_confirmed: true,
      has_rti_reply: false,
      mutation_reference: 'RD 42 LGP 2018',
      published: true,
      wording_code: 'P3_ORDER_VERIFIED',
      encrypted_owner_name: CryptoAuditService.encryptSensitive('ಸಾರ್ವಜನಿಕ ಸಮುದಾಯ ಆರೋಗ್ಯ ಕೇಂದ್ರ'),
      coordinates: { x: 165, y: 145, width: 110, height: 85 },
    },
  ];

  private static documents: DocumentRecord[] = [
    {
      id: 'doc-base-104',
      parcel_id: 'par-104',
      title: 'ಹಿಂದಿನ ಮೂಲ ಪಹಣಿ (1975-1976 RTC)',
      document_type: 'RTC_PAHANI',
      sha256_hash: '8f43a9b1c78e3d65b12a884e910245fd1243ab98c0d12e3f45a6b7c8d9e0f1a2',
      received_date: '2026-01-15',
      uploaded_by: 'volunteer_a',
      reviewer_confirmed: true,
      file_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      is_public_sanitized: true,
    },
    {
      id: 'doc-curr-104',
      parcel_id: 'par-104',
      title: 'ಪ್ರಸ್ತುತ ಪಹಣಿ (Current 2025 RTC)',
      document_type: 'RTC_PAHANI',
      sha256_hash: '4e910245fd1243ab98c0d12e3f45a6b78f43a9b1c78e3d65b12a88c8d9e0f1b3',
      received_date: '2026-02-10',
      uploaded_by: 'volunteer_b',
      reviewer_confirmed: true,
      file_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      is_public_sanitized: true,
    },
    {
      id: 'doc-rti-104',
      parcel_id: 'par-104',
      title: 'ತಾಲೂಕು ಕಚೇರಿ RTI ಲಿಖಿತ ಉತ್ತರ',
      document_type: 'RTI_REPLY',
      sha256_hash: '3ab98c0d12e3f45a6b7c8d9e0f1a28f43a9b1c78e3d65b12a884e910245fd124',
      received_date: '2026-03-01',
      uploaded_by: 'verifier_senior',
      reviewer_confirmed: true,
      file_url: 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?auto=format&fit=crop&w=800&q=80',
      is_public_sanitized: true,
    },
    {
      id: 'doc-parent-88',
      parcel_id: 'par-88',
      title: 'ಮೂಲ ಸರ್ವೆ 88 ರ ಆಕಾರಬಂಧು ಮತ್ತು ಪಹಣಿ (5 ಎಕರೆ)',
      document_type: 'RTC_PAHANI',
      sha256_hash: '910245fd1243ab98c0d12e3f45a6b7c8d9e0f1a28f43a9b1c78e3d65b12a884e',
      received_date: '2026-02-12',
      uploaded_by: 'entrant_kavitha',
      reviewer_confirmed: true,
      file_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      is_public_sanitized: true,
    },
    {
      id: 'doc-child-88-1',
      parcel_id: 'par-88',
      title: 'ಹಿಸ್ಸಾ 88/1 ಪಹಣಿ (3 ಎಕರೆ)',
      document_type: 'RTC_PAHANI',
      sha256_hash: '12e3f45a6b7c8d9e0f1a28f43a9b1c78e3d65b12a884e910245fd1243ab98c0d',
      received_date: '2026-02-14',
      uploaded_by: 'entrant_kavitha',
      reviewer_confirmed: true,
      file_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      is_public_sanitized: true,
    },
    {
      id: 'doc-child-88-2',
      parcel_id: 'par-88',
      title: 'ಹಿಸ್ಸಾ 88/2 ಪಹಣಿ (2 ಎಕರೆ 20 ಗುಂಟೆ)',
      document_type: 'RTC_PAHANI',
      sha256_hash: 'c8d9e0f1a28f43a9b1c78e3d65b12a884e910245fd1243ab98c0d12e3f45a6b7',
      received_date: '2026-02-14',
      uploaded_by: 'entrant_manjunath',
      reviewer_confirmed: true,
      file_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      is_public_sanitized: true,
    },
  ];

  private static tasks: Task[] = [
    {
      id: 'task-1',
      parcel_id: 'par-45',
      village_name: 'Kallur',
      survey_number: '45/1',
      task_type: 'REQUEST_ORDER',
      reason: 'Request order authorising change from GOMAL to KHAS_DARAKHT',
      status: 'OPEN',
      created_by_rule: 'R2',
      created_at: '2026-03-02T10:00:00Z',
      deduplication_key: 'par-45:REQUEST_ORDER:Request order authorising',
    },
    {
      id: 'task-2',
      parcel_id: 'par-88',
      village_name: 'Kallur',
      survey_number: '88',
      task_type: 'RESOLVE_DISCREPANCY',
      reason: 'Investigate sub-division extent discrepancy (Sum 5A-20G > Parent 5A-0G)',
      status: 'OPEN',
      created_by_rule: 'R1',
      created_at: '2026-03-03T11:30:00Z',
      deduplication_key: 'par-88:RESOLVE_DISCREPANCY:Investigate sub-division',
    },
    {
      id: 'task-3',
      parcel_id: 'par-12',
      village_name: 'Kallur',
      survey_number: '12',
      task_type: 'MAP_TENURE_TERM',
      reason: 'Map vocabulary term "ಗೋ.ಖಾ.ಬಂ" in tenure terms table',
      status: 'OPEN',
      created_by_rule: 'R2',
      created_at: '2026-03-04T09:15:00Z',
      deduplication_key: 'par-12:MAP_TENURE_TERM:Map vocabulary term',
    },
  ];

  private static tenureTerms: TenureTermMapping[] = [
    { raw_term: 'ಗೋಮಾಳ', canonical_code: 'GOMAL', status: 'CONFIRMED', mapped_by: 'admin', mapped_at: '2026-01-10' },
    { raw_term: 'ಗೋದಾನ ಜಮೀನು', canonical_code: 'GOMAL', status: 'CONFIRMED', mapped_by: 'admin', mapped_at: '2026-01-10' },
    { raw_term: 'ಸಾರ್ವಜನಿಕ ಮೇಯುವಿಕೆ', canonical_code: 'GOMAL', status: 'CONFIRMED', mapped_by: 'admin', mapped_at: '2026-01-10' },
    { raw_term: 'ಖಾಸ್ ದರಖಾಸ್ತು', canonical_code: 'KHAS_DARAKHT', status: 'CONFIRMED', mapped_by: 'verifier_1', mapped_at: '2026-01-14' },
    { raw_term: 'ಖಾಸಗಿ ಪಟ್ಟಾ', canonical_code: 'PATTA_PRIVATE', status: 'CONFIRMED', mapped_by: 'verifier_1', mapped_at: '2026-01-14' },
    { raw_term: 'ಇನಾಂ ರದ್ದಿಯಾತಿ', canonical_code: 'INAM_ABOLISHED', status: 'CONFIRMED', mapped_by: 'verifier_1', mapped_at: '2026-01-20' },
    { raw_term: 'ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ಕಟ್ಟಡ', canonical_code: 'PUBLIC_HOSPITAL', status: 'CONFIRMED', mapped_by: 'verifier_1', mapped_at: '2026-02-01' },
    { raw_term: 'ಗೋ.ಖಾ.ಬಂ', canonical_code: 'GOMAL', status: 'UNCONFIRMED', mapped_by: 'entrant_a', mapped_at: '2026-03-04' },
  ];

  private static tierChangeRequests: TierChangeRequest[] = [
    {
      id: 'tcr-1',
      parcel_id: 'par-104',
      survey_number: '104/2',
      from_tier: 'T2_OFFICE_ASKED',
      to_tier: 'T3_OFFICIAL_OUTCOME',
      maker_id: 'reviewer_anand',
      maker_name: 'Anand K. (Moderator)',
      checker_id: 'verifier_sumana',
      checker_name: 'Sumana Rao (Senior Verifier)',
      status: 'APPROVED',
      justification: 'Confirmed RTI response from Tahsildar stating no order was issued.',
      created_at: '2026-03-02',
    },
    {
      id: 'tcr-2',
      parcel_id: 'par-45',
      survey_number: '45/1',
      from_tier: 'T0_REPORTED',
      to_tier: 'T1_RECORD_OBSERVATION',
      maker_id: 'reviewer_anand',
      maker_name: 'Anand K. (Moderator)',
      checker_id: undefined,
      checker_name: undefined,
      status: 'PROPOSED',
      justification: 'Double entry confirmed by two independent volunteers showing tenure changed from Gomal.',
      created_at: '2026-03-04',
    },
  ];

  private static officeRequests: OfficeRequest[] = [
    {
      id: 'req-104',
      parcel_id: 'par-104',
      survey_number: '104/2',
      request_type: 'RTI_6_1',
      sent_date: '2026-01-20',
      proof_doc_id: 'doc-proof-104',
      response_window_days: 30,
      status: 'office_replied',
      created_at: '2026-01-20',
    },
    {
      id: 'req-45',
      parcel_id: 'par-45',
      survey_number: '45/1',
      request_type: 'VERIFICATION_REQUEST',
      sent_date: '2026-02-28',
      proof_doc_id: 'doc-proof-45',
      response_window_days: 30,
      status: 'sent',
      created_at: '2026-02-28',
    },
  ];

  private static reports: CitizenReport[] = [
    {
      id: 'rep-01',
      tracking_hmac: CryptoAuditService.hashTrackingCode('e4a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5'),
      village_id: 'vil-kallur',
      survey_number: '45/1',
      description: 'ಹಿಂದಿನ ಪಹಣಿಯಲ್ಲಿ ಗೋಮಾಳ ಎಂದಿತ್ತು, ಈಗ ಖಾಸಗಿ ಕಟ್ಟಡ ನಿರ್ಮಾಣವಾಗುತ್ತಿದೆ.',
      photo_hashes: ['sha256-4e910245fd1243ab'],
      corroboration_count: 2,
      status: 'LINKED_TO_PARCEL',
      created_at: '2026-02-05',
      has_contact_encrypted: true,
    },
    {
      id: 'rep-02',
      tracking_hmac: CryptoAuditService.hashTrackingCode('1234567890abcdef1234567890abcdef'),
      village_id: 'vil-kallur',
      survey_number: '88',
      description: 'ಸರ್ವೆ ನಂಬರ್ 88 ರಲ್ಲಿ ಹಿಸ್ಸಾ ಮಾಡಿದ ನಂತರ ವಿಸ್ತೀರ್ಣ ಹೆಚ್ಚಾಗಿದೆ ಎಂದು ಹಿರಿಯರು ಹೇಳುತ್ತಿದ್ದಾರೆ.',
      photo_hashes: ['sha256-12e3f45a6b7c8d9e'],
      corroboration_count: 1,
      status: 'MODERATED',
      created_at: '2026-02-18',
      has_contact_encrypted: false,
    },
  ];

  // Active double-entry records queue for demonstration
  private static pendingDoubleEntries: {
    parcelId: string;
    surveyNumber: string;
    entrantA?: RecordEntry;
    entrantB?: RecordEntry;
    status: 'NEEDS_ENTRANT_B' | 'DISCREPANCY_DETECTED' | 'CONFIRMED';
  }[] = [
    {
      parcelId: 'par-45',
      surveyNumber: '45/1',
      entrantA: {
        id: 'entry-a-1',
        parcel_id: 'par-45',
        entrant_id: 'user_ramesh',
        entrant_name: 'Ramesh K. (Vol-A)',
        survey_number: '45',
        hissa: '1',
        tenure: 'ಖಾಸ್ ದರಖಾಸ್ತು',
        acres: 3,
        guntas: 0,
        anas: 0,
        mutation_reference: '',
        owner_name: 'ತಿಮ್ಮಯ್ಯ ಬಿನ್ ರಾಮಯ್ಯ',
        created_at: '2026-03-01T10:00:00Z',
      },
      entrantB: {
        id: 'entry-b-1',
        parcel_id: 'par-45',
        entrant_id: 'user_priya',
        entrant_name: 'Priya M. (Vol-B)',
        survey_number: '45',
        hissa: '1',
        tenure: 'ಖಾಸ್ ದರಖಾಸ್ತು',
        acres: 3,
        guntas: 2, // Discrepancy intentional for verifier resolution demonstration!
        anas: 0,
        mutation_reference: '',
        owner_name: 'ತಿಮ್ಮಯ್ಯ ಬಿನ್ ರಾಮಯ್ಯ',
        created_at: '2026-03-01T11:15:00Z',
      },
      status: 'DISCREPANCY_DETECTED',
    },
  ];

  // Initialize seed audit log
  public static initialize(): void {
    if (CryptoAuditService.getAuditLog().length === 0) {
      CryptoAuditService.appendAuditLog({
        actor_id: 'system_bootstrap',
        actor_name: 'System Bootstrapper',
        action: 'BOOTSTRAP_DATABASE',
        target_id: 'vil-kallur',
        details: 'Initialized pilot village Kallur with 24 parcels and confirmed baseline records',
      });
      CryptoAuditService.appendAuditLog({
        actor_id: 'verifier_sumana',
        actor_name: 'Sumana Rao',
        action: 'CONFIRM_DOCUMENT',
        target_id: 'doc-base-104',
        details: 'Confirmed 1975-76 baseline RTC from certified taluk copy',
      });
      CryptoAuditService.appendAuditLog({
        actor_id: 'verifier_sumana',
        actor_name: 'Sumana Rao',
        action: 'APPROVE_TIER_CHANGE',
        target_id: 'par-104',
        details: 'Approved Tier Change to T3_OFFICIAL_OUTCOME following Tahsildar RTI confirmation',
      });
    }
  }

  // Getters
  public static getVillages(): Village[] {
    return this.villages;
  }

  public static getParcels(villageId?: string): Parcel[] {
    if (!villageId) return this.parcels;
    return this.parcels.filter(p => p.village_id === villageId);
  }

  public static getParcelById(id: string): Parcel | undefined {
    return this.parcels.find(p => p.id === id);
  }

  public static getDocumentsForParcel(parcelId: string): DocumentRecord[] {
    return this.documents.filter(d => d.parcel_id === parcelId);
  }

  public static getTasks(): Task[] {
    return this.tasks;
  }

  public static getTenureTerms(): TenureTermMapping[] {
    return this.tenureTerms;
  }

  public static getTierRequests(): TierChangeRequest[] {
    return this.tierChangeRequests;
  }

  public static getOfficeRequests(): OfficeRequest[] {
    return this.officeRequests;
  }

  public static getPendingDoubleEntries() {
    return this.pendingDoubleEntries;
  }

  // Workflow actions

  /**
   * Evaluates rules for a given parcel.
   */
  public static evaluateRulesForParcel(parcel: Parcel, tolAbs = 0, tolRelBp = 0): RuleResult[] {
    const results: RuleResult[] = [];
    const docs = this.getDocumentsForParcel(parcel.id);
    const docIds = docs.map(d => d.id);

    // R1
    const r1 = RuleEngineService.evaluateR1({
      parcelId: parcel.id,
      surveyNumber: parcel.survey_number,
      parentExtentAnas: parcel.gross_extent_anas,
      parentDocId: docIds[0],
      childExtentsAnas: parcel.has_subdivisions ? [1920, 1600] : [], // Sample sub-division test extents if subdivided
      childDocIds: docIds.slice(1),
      childrenComplete: parcel.children_complete,
      extentComparisonBasis: 'GROSS',
      tolAbsAnas: tolAbs,
      tolRelBp: tolRelBp,
    });
    results.push(r1.result);

    // R2
    const tenureMapping = this.tenureTerms.find(t => t.raw_term === parcel.current_tenure);
    const currentCode = tenureMapping ? tenureMapping.canonical_code : parcel.current_tenure;

    const r2 = RuleEngineService.evaluateR2({
      parcelId: parcel.id,
      surveyNumber: parcel.survey_number,
      baselineTenureTerm: parcel.baseline_tenure,
      baselineTenureCode: parcel.baseline_tenure,
      baselineDocId: docIds[0],
      currentTenureTerm: parcel.current_tenure,
      currentTenureCode: currentCode,
      currentDocId: docIds[1] || docIds[0],
      hasOrderDoc: parcel.has_order_document,
      orderDocId: parcel.has_order_document ? docs.find(d => d.document_type === 'SANCTION_ORDER')?.id : undefined,
      orderConfirmed: parcel.order_confirmed,
      hasRtiReply: parcel.has_rti_reply,
      rtiReplyType: parcel.rti_reply_type,
      rtiReplyConfirmed: parcel.rti_reply_confirmed,
      rtiDocId: parcel.has_rti_reply ? docs.find(d => d.document_type === 'RTI_REPLY')?.id : undefined,
    });
    results.push(r2.result);

    // R3
    const tenureChanged = parcel.baseline_tenure !== currentCode;
    const r3 = RuleEngineService.evaluateR3({
      parcelId: parcel.id,
      surveyNumber: parcel.survey_number,
      tenureChanged,
      mutationReference: parcel.mutation_reference,
      mutationFieldConfirmed: true,
    });
    results.push(r3.result);

    return results;
  }

  /**
   * Submits a new citizen report
   */
  public static submitReport(data: {
    villageId: string;
    surveyNumber: string;
    description: string;
    contact?: string;
    fileHash?: string;
  }): { reportId: string; plainTrackingCode: string } {
    const plainTrackingCode = CryptoAuditService.generateTrackingCode();
    const trackingHmac = CryptoAuditService.hashTrackingCode(plainTrackingCode);
    const reportId = `rep-${Date.now().toString(36)}`;

    const newReport: CitizenReport = {
      id: reportId,
      tracking_hmac: trackingHmac,
      village_id: data.villageId,
      survey_number: data.surveyNumber || 'Unspecified',
      description: data.description,
      photo_hashes: data.fileHash ? [data.fileHash] : [],
      corroboration_count: 1,
      status: 'SUBMITTED',
      created_at: new Date().toISOString(),
      has_contact_encrypted: !!data.contact,
    };

    this.reports.push(newReport);

    CryptoAuditService.appendAuditLog({
      actor_id: 'anonymous_reporter',
      actor_name: 'Citizen Reporter',
      action: 'SUBMIT_CITIZEN_REPORT',
      target_id: reportId,
      details: `Submitted report for Village ${data.villageId}, Survey ${data.surveyNumber}`,
    });

    return { reportId, plainTrackingCode };
  }

  /**
   * Tracks a report by raw code using constant-time check
   */
  public static trackReport(plainCode: string): CitizenReport | null {
    const targetHmac = CryptoAuditService.hashTrackingCode(plainCode);
    for (const report of this.reports) {
      if (CryptoAuditService.constantTimeCompare(report.tracking_hmac, targetHmac)) {
        return report;
      }
    }
    return null;
  }

  /**
   * Proposes a tier change (Maker)
   */
  public static proposeTierChange(
    parcelId: string,
    toTier: EvidenceTier,
    makerId: string,
    makerName: string,
    justification: string
  ): TierChangeRequest {
    const parcel = this.getParcelById(parcelId);
    if (!parcel) throw new Error('Parcel not found');

    const req: TierChangeRequest = {
      id: `tcr-${Date.now()}`,
      parcel_id: parcelId,
      survey_number: parcel.survey_number,
      from_tier: parcel.tier,
      to_tier: toTier,
      maker_id: makerId,
      maker_name: makerName,
      status: 'PROPOSED',
      justification,
      created_at: new Date().toISOString(),
    };

    this.tierChangeRequests.unshift(req);

    CryptoAuditService.appendAuditLog({
      actor_id: makerId,
      actor_name: makerName,
      action: 'PROPOSE_TIER_CHANGE',
      target_id: parcelId,
      details: `Proposed tier change from ${parcel.tier} to ${toTier}. Justification: ${justification}`,
    });

    return req;
  }

  /**
   * Approves a tier change (Checker).
   * ENFORCES MAKER-CHECKER CONSTRAINT: maker_id !== checker_id
   */
  public static approveTierChange(
    requestId: string,
    checkerId: string,
    checkerName: string
  ): void {
    const req = this.tierChangeRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Tier request not found');

    // Strict Maker-Checker check
    if (req.maker_id === checkerId) {
      throw new Error('Integrity Violation: Checker must be a different individual from Maker (maker_id != checker_id)');
    }

    req.checker_id = checkerId;
    req.checker_name = checkerName;
    req.status = 'APPROVED';

    const parcel = this.getParcelById(req.parcel_id);
    if (parcel) {
      parcel.tier = req.to_tier;
    }

    CryptoAuditService.appendAuditLog({
      actor_id: checkerId,
      actor_name: checkerName,
      action: 'APPROVE_TIER_CHANGE',
      target_id: req.parcel_id,
      details: `Approved tier change from ${req.from_tier} to ${req.to_tier} (Maker: ${req.maker_name})`,
    });
  }

  /**
   * Verifier resolves double-entry discrepancy
   */
  public static resolveDiscrepancy(
    parcelId: string,
    resolvedField: string,
    resolvedValue: any,
    reason: string,
    verifierId: string,
    verifierName: string
  ): void {
    const item = this.pendingDoubleEntries.find(p => p.parcelId === parcelId);
    if (!item) throw new Error('Pending entry not found');

    if (!reason || reason.trim().length < 5) {
      throw new Error('Resolution justification must be recorded for audit trail');
    }

    item.status = 'CONFIRMED';

    CryptoAuditService.appendAuditLog({
      actor_id: verifierId,
      actor_name: verifierName,
      action: 'RESOLVE_DOUBLE_ENTRY_DISCREPANCY',
      target_id: parcelId,
      details: `Resolved field '${resolvedField}' to '${resolvedValue}'. Reason: ${reason}`,
    });
  }

  /**
   * Maps a raw Kannada tenure term to canonical code
   */
  public static mapTenureTerm(
    rawTerm: string,
    canonicalCode: string,
    actorId: string,
    actorName: string
  ): void {
    const existing = this.tenureTerms.find(t => t.raw_term === rawTerm);
    if (existing) {
      existing.canonical_code = canonicalCode;
      existing.status = 'CONFIRMED';
      existing.mapped_by = actorName;
      existing.mapped_at = new Date().toISOString().split('T')[0];
    } else {
      this.tenureTerms.push({
        raw_term: rawTerm,
        canonical_code: canonicalCode,
        status: 'CONFIRMED',
        mapped_by: actorName,
        mapped_at: new Date().toISOString().split('T')[0],
      });
    }

    CryptoAuditService.appendAuditLog({
      actor_id: actorId,
      actor_name: actorName,
      action: 'MAP_TENURE_TERM',
      target_id: rawTerm,
      details: `Mapped raw tenure term '${rawTerm}' to '${canonicalCode}'`,
    });
  }

  /**
   * Checks the 4 Publishing Gates for a parcel:
   * 1. Two different reviewer approvals (maker-checker approved tier or publication)
   * 2. Office request sent >= RESPONSE_WINDOW_DAYS (30 days) earlier with proof
   * 3. Wording comes only from public_phrases.yaml
   * 4. Village golden set calibration passes
   */
  public static checkPublishingGate(parcel: Parcel): {
    canPublish: boolean;
    gates: {
      makerCheckerPassed: boolean;
      officeWindowPassed: boolean;
      wordingApproved: boolean;
      goldenSetPassed: boolean;
    };
    details: string[];
  } {
    const details: string[] = [];

    // Gate 1: Maker-Checker approval
    const approvedTcr = this.tierChangeRequests.find(
      r => r.parcel_id === parcel.id && r.status === 'APPROVED' && r.checker_id && r.checker_id !== r.maker_id
    );
    const makerCheckerPassed = !!approvedTcr;
    if (!makerCheckerPassed) {
      details.push('Gate 1 Failed: Requires two independent reviewer approvals (Maker & Checker)');
    }

    // Gate 2: Office request recorded as sent >= 30 days earlier
    const officeReq = this.officeRequests.find(r => r.parcel_id === parcel.id);
    let officeWindowPassed = false;
    if (officeReq) {
      const sentTime = new Date(officeReq.sent_date).getTime();
      const now = new Date().getTime();
      const elapsedDays = Math.floor((now - sentTime) / (1000 * 60 * 60 * 24));
      if (elapsedDays >= officeReq.response_window_days || officeReq.status === 'office_replied') {
        officeWindowPassed = true;
      } else {
        details.push(`Gate 2 Failed: Office request sent ${elapsedDays} days ago (Requires >= ${officeReq.response_window_days} days)`);
      }
    } else {
      details.push('Gate 2 Failed: No verification request or RTI recorded with proof document');
    }

    // Gate 3: Wording from approved phrases
    const wordingApproved = !!parcel.wording_code;
    if (!wordingApproved) {
      details.push('Gate 3 Failed: Wording must be selected from approved public phrases');
    }

    // Gate 4: Village golden set passed
    const village = this.villages.find(v => v.id === parcel.village_id);
    const goldenSetPassed = village ? village.golden_set_passed : false;
    if (!goldenSetPassed) {
      details.push('Gate 4 Failed: Village golden set calibration has not passed');
    }

    const canPublish = makerCheckerPassed && officeWindowPassed && wordingApproved && goldenSetPassed;

    return {
      canPublish,
      gates: {
        makerCheckerPassed,
        officeWindowPassed,
        wordingApproved,
        goldenSetPassed,
      },
      details,
    };
  }
}
