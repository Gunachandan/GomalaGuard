/**
 * Core Domain Types for Gomala Atlas v2
 */

export type Language = 'kn' | 'en';

export type UserRole = 
  | 'public_visitor'
  | 'reporter'
  | 'entrant'
  | 'moderator'
  | 'verifier'
  | 'admin';

export interface Extent {
  acres: number;
  guntas: number;
  anas: number;
  totalAnas: number;
}

export type ExtentComparisonBasis = 'GROSS' | 'NET' | 'UNCONFIRMED';

export type RuleState = 
  | 'CONSISTENT' 
  | 'NOT_APPLICABLE' 
  | 'CHANGE_OBSERVED' 
  | 'CONTRADICTED' 
  | 'NOT_CHECKABLE';

export type EvidenceTier = 
  | 'T0_REPORTED' 
  | 'T1_RECORD_OBSERVATION' 
  | 'T2_OFFICE_ASKED' 
  | 'T3_OFFICIAL_OUTCOME';

export type RtiReplyType =
  | 'ORDER_PROVIDED'
  | 'ORDER_STATED_NOT_ISSUED'
  | 'INFORMATION_NOT_AVAILABLE'
  | 'TRANSFERRED_TO_OTHER_OFFICE'
  | 'REFUSED_WITH_REASON'
  | 'NO_REPLY_WITHIN_PERIOD'
  | 'OTHER_REVIEW_REQUIRED';

export interface Village {
  id: string;
  code: string;
  name_kn: string;
  name_en: string;
  district: string;
  taluk: string;
  hobli: string;
  total_parcels: number;
  reported_count: number;
  reviewed_count: number;
  golden_set_passed: boolean;
}

export interface Parcel {
  id: string;
  village_id: string;
  survey_number: string;
  hissa: string;
  baseline_tenure: string;
  current_tenure: string;
  gross_extent_anas: number;
  kharab_extent_anas?: number;
  net_extent_anas?: number;
  has_subdivisions: boolean;
  children_complete: boolean;
  parent_parcel_id?: string;
  tier: EvidenceTier;
  has_order_document: boolean;
  order_confirmed: boolean;
  has_rti_reply: boolean;
  rti_reply_type?: RtiReplyType | null;
  rti_reply_confirmed?: boolean;
  rti_reply_quote?: string;
  mutation_reference?: string;
  published: boolean;
  wording_code?: string;
  // Encrypted personal name (never exposed publicly)
  encrypted_owner_name?: string;
  coordinates?: { x: number; y: number; width: number; height: number };
}

export interface DocumentRecord {
  id: string;
  parcel_id: string;
  title: string;
  document_type: 'RTC_PAHANI' | 'MUTATION_REGISTER' | 'SANCTION_ORDER' | 'RTI_REPLY' | 'VILLAGE_MAP';
  sha256_hash: string;
  received_date: string;
  uploaded_by: string;
  reviewer_confirmed: boolean;
  file_url: string;
  is_public_sanitized: boolean;
}

export interface RecordEntry {
  id: string;
  parcel_id: string;
  entrant_id: string;
  entrant_name: string;
  survey_number: string;
  hissa: string;
  tenure: string;
  acres: number;
  guntas: number;
  anas: number;
  mutation_reference: string;
  owner_name: string;
  created_at: string;
}

export interface ResolvedField {
  fieldName: string;
  entrantA_val: string;
  entrantB_val: string;
  resolved_val: string;
  justification: string;
  resolved_by: string;
}

export interface Task {
  id: string;
  parcel_id: string;
  village_name: string;
  survey_number: string;
  task_type: 'RESOLVE_DISCREPANCY' | 'REQUEST_ORDER' | 'MAP_TENURE_TERM' | 'VERIFIER_REVIEW' | 'FILE_RTI_APPEAL';
  reason: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_by_rule?: string;
  created_at: string;
  assigned_to?: string;
  deduplication_key: string;
}

export interface TierChangeRequest {
  id: string;
  parcel_id: string;
  survey_number: string;
  from_tier: EvidenceTier;
  to_tier: EvidenceTier;
  maker_id: string;
  maker_name: string;
  checker_id?: string;
  checker_name?: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  justification: string;
  created_at: string;
}

export interface OfficeRequest {
  id: string;
  parcel_id: string;
  survey_number: string;
  request_type: 'RTI_6_1' | 'VERIFICATION_REQUEST';
  sent_date: string;
  proof_doc_id: string;
  response_window_days: number;
  status: 'not_sent' | 'sent' | 'office_replied' | 'entry_corrected' | 'no_reply_after_window';
  created_at: string;
}

export interface RuleResult {
  rule_name: 'R1_SUBDIVISION_EXTENT' | 'R2_TENURE_CHANGE' | 'R3_MUTATION_REF';
  rule_version: string;
  state: RuleState;
  reason: string;
  input_record_ids: string[];
  input_document_ids: string[];
  config_hash: string;
  timestamp: string;
  parcel_id: string;
}

export interface AuditLogRow {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_id: string;
  details: string;
  prev_hash: string;
  current_hash: string;
}

export interface CitizenReport {
  id: string;
  tracking_hmac: string;
  village_id: string;
  survey_number: string;
  description: string;
  photo_hashes: string[];
  corroboration_count: number;
  status: 'SUBMITTED' | 'MODERATED' | 'LINKED_TO_PARCEL' | 'REJECTED';
  created_at: string;
  has_contact_encrypted: boolean;
}

export interface TenureTermMapping {
  raw_term: string;
  canonical_code: string;
  status: 'CONFIRMED' | 'UNCONFIRMED';
  mapped_by: string;
  mapped_at: string;
}
