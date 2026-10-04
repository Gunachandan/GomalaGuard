-- Gomala Atlas v2: PostgreSQL 15+ Schema, Roles, RLS & Extent Functions
-- Architecture Spec Section 3, 4, 5, 8

-- ============================================================================
-- 1. DATABASE ROLES & ACCESS CONTROL
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_public') THEN
    CREATE ROLE app_public LOGIN PASSWORD 'public_role_pw';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_reporter') THEN
    CREATE ROLE app_reporter LOGIN PASSWORD 'reporter_role_pw';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_reviewer') THEN
    CREATE ROLE app_reviewer LOGIN PASSWORD 'reviewer_role_pw';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin LOGIN PASSWORD 'admin_role_pw';
  END IF;
END
$$;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. EXTENT ARITHMETIC SQL FUNCTIONS
-- Area strictly stored as integer count of anas (1 Acre = 40 Guntas = 640 Anas).
-- Zero floating point. Negative subtraction throws.
-- ============================================================================

CREATE OR REPLACE FUNCTION extent_to_anas(acres INT, guntas INT, anas INT) 
RETURNS INT AS $$
BEGIN
  IF acres < 0 OR guntas < 0 OR anas < 0 THEN
    RAISE EXCEPTION 'Negative extent values are not permitted';
  END IF;
  RETURN (acres * 640) + (guntas * 16) + anas;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extent_from_anas(total_anas INT) 
RETURNS TEXT AS $$
DECLARE
  v_acres INT;
  v_rem INT;
  v_guntas INT;
  v_anas INT;
BEGIN
  IF total_anas < 0 THEN
    RAISE EXCEPTION 'Negative total anas is not permitted';
  END IF;
  v_acres := total_anas / 640;
  v_rem := total_anas % 640;
  v_guntas := v_rem / 16;
  v_anas := v_rem % 16;
  RETURN v_acres || 'A-' || v_guntas || 'G-' || v_anas || 'A';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extent_subtract(a INT, b INT) 
RETURNS INT AS $$
BEGIN
  IF a < b THEN
    RAISE EXCEPTION 'Negative extent subtraction refused';
  END IF;
  RETURN a - b;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extent_tolerance(parent_anas INT, tol_abs INT, tol_rel_bp INT) 
RETURNS INT AS $$
DECLARE
  v_rel INT;
BEGIN
  IF parent_anas < 0 OR tol_abs < 0 OR tol_rel_bp < 0 THEN
    RAISE EXCEPTION 'Negative parameters refused';
  END IF;
  v_rel := CEIL((parent_anas::NUMERIC * tol_rel_bp::NUMERIC) / 10000.0)::INT;
  RETURN GREATEST(tol_abs, v_rel);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 3. BASE TABLES WITH CONSTRAINTS
-- ============================================================================

-- Reviewers / Actors
CREATE TABLE IF NOT EXISTS reviewers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('entrant', 'moderator', 'verifier', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geography
CREATE TABLE IF NOT EXISTS villages (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_kn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  district TEXT NOT NULL,
  taluk TEXT NOT NULL,
  hobli TEXT NOT NULL,
  golden_set_passed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parcels (
  id TEXT PRIMARY KEY,
  village_id TEXT NOT NULL REFERENCES villages(id),
  survey_number TEXT NOT NULL,
  hissa TEXT NOT NULL DEFAULT '*',
  baseline_tenure TEXT NOT NULL,
  current_tenure TEXT NOT NULL,
  gross_extent_anas INT NOT NULL CHECK (gross_extent_anas >= 0),
  kharab_extent_anas INT DEFAULT 0 CHECK (kharab_extent_anas >= 0),
  net_extent_anas INT DEFAULT 0 CHECK (net_extent_anas >= 0),
  has_subdivisions BOOLEAN DEFAULT FALSE,
  children_complete BOOLEAN DEFAULT FALSE,
  tier TEXT NOT NULL CHECK (tier IN ('T0_REPORTED', 'T1_RECORD_OBSERVATION', 'T2_OFFICE_ASKED', 'T3_OFFICIAL_OUTCOME')),
  has_order_document BOOLEAN DEFAULT FALSE,
  order_confirmed BOOLEAN DEFAULT FALSE,
  has_rti_reply BOOLEAN DEFAULT FALSE,
  mutation_reference TEXT,
  encrypted_owner_name TEXT, -- Envelope encrypted, never plain
  published BOOLEAN DEFAULT FALSE,
  wording_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parcel_lineage (
  parent_parcel_id TEXT NOT NULL REFERENCES parcels(id),
  child_parcel_id TEXT NOT NULL REFERENCES parcels(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (parent_parcel_id, child_parcel_id)
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  parcel_id TEXT NOT NULL REFERENCES parcels(id),
  title TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('RTC_PAHANI', 'MUTATION_REGISTER', 'SANCTION_ORDER', 'RTI_REPLY', 'VILLAGE_MAP')),
  sha256_hash TEXT NOT NULL,
  file_path TEXT NOT NULL,
  received_date DATE NOT NULL,
  uploaded_by TEXT NOT NULL REFERENCES reviewers(id),
  reviewer_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS record_entries (
  id TEXT PRIMARY KEY,
  parcel_id TEXT NOT NULL REFERENCES parcels(id),
  entrant_id TEXT NOT NULL REFERENCES reviewers(id),
  survey_number TEXT NOT NULL,
  hissa TEXT NOT NULL,
  tenure TEXT NOT NULL,
  extent_anas INT NOT NULL CHECK (extent_anas >= 0),
  mutation_reference TEXT,
  encrypted_owner_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  parcel_id TEXT NOT NULL REFERENCES parcels(id),
  survey_number TEXT NOT NULL,
  hissa TEXT NOT NULL,
  tenure TEXT NOT NULL,
  extent_anas INT NOT NULL,
  mutation_reference TEXT,
  encrypted_owner_name TEXT,
  confirmed_by TEXT NOT NULL REFERENCES reviewers(id),
  confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenure_terms (
  raw_term TEXT PRIMARY KEY,
  canonical_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CONFIRMED', 'UNCONFIRMED')),
  mapped_by TEXT NOT NULL REFERENCES reviewers(id),
  mapped_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Pure Rule Results with CONTRADICTED 2-document constraint
CREATE TABLE IF NOT EXISTS rule_results (
  id TEXT PRIMARY KEY,
  parcel_id TEXT NOT NULL REFERENCES parcels(id),
  rule_name TEXT NOT NULL CHECK (rule_name IN ('R1_SUBDIVISION_EXTENT', 'R2_TENURE_CHANGE', 'R3_MUTATION_REF')),
  rule_version TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('CONSISTENT', 'NOT_APPLICABLE', 'CHANGE_OBSERVED', 'CONTRADICTED', 'NOT_CHECKABLE')),
  reason TEXT NOT NULL,
  input_record_ids TEXT[] NOT NULL,
  input_document_ids TEXT[] NOT NULL,
  config_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Architectural Constraint: CONTRADICTED requires at least 2 source document IDs
  CONSTRAINT check_contradicted_requires_two_docs 
    CHECK (state <> 'CONTRADICTED' OR array_length(input_document_ids, 1) >= 2)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  parcel_id TEXT NOT NULL REFERENCES parcels(id),
  task_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  created_by_rule TEXT,
  assigned_to TEXT REFERENCES reviewers(id),
  deduplication_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  tracking_hmac TEXT NOT NULL UNIQUE,
  village_id TEXT NOT NULL REFERENCES villages(id),
  survey_number TEXT NOT NULL,
  description TEXT NOT NULL,
  corroboration_count INT DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'MODERATED', 'LINKED_TO_PARCEL', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_media (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id),
  file_hash TEXT NOT NULL,
  original_path TEXT NOT NULL,
  public_sanitized_path TEXT NOT NULL,
  metadata_stripped BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_contacts (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id) UNIQUE,
  encrypted_contact TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS office_requests (
  id TEXT PRIMARY KEY,
  parcel_id TEXT NOT NULL REFERENCES parcels(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('RTI_6_1', 'VERIFICATION_REQUEST')),
  sent_date DATE NOT NULL,
  proof_doc_id TEXT NOT NULL REFERENCES documents(id),
  response_window_days INT NOT NULL DEFAULT 30,
  status TEXT NOT NULL CHECK (status IN ('not_sent', 'sent', 'office_replied', 'entry_corrected', 'no_reply_after_window')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS office_responses (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES office_requests(id),
  reply_type TEXT NOT NULL CHECK (reply_type IN (
    'ORDER_PROVIDED',
    'ORDER_STATED_NOT_ISSUED',
    'INFORMATION_NOT_AVAILABLE',
    'TRANSFERRED_TO_OTHER_OFFICE',
    'REFUSED_WITH_REASON',
    'NO_REPLY_WITHIN_PERIOD',
    'OTHER_REVIEW_REQUIRED'
  )),
  quoted_sentence TEXT NOT NULL,
  doc_id TEXT NOT NULL REFERENCES documents(id),
  confirmed_by_verifier TEXT NOT NULL REFERENCES reviewers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier Change Requests with strict Maker-Checker constraint
CREATE TABLE IF NOT EXISTS tier_change_requests (
  id TEXT PRIMARY KEY,
  parcel_id TEXT NOT NULL REFERENCES parcels(id),
  from_tier TEXT NOT NULL,
  to_tier TEXT NOT NULL,
  maker_id TEXT NOT NULL REFERENCES reviewers(id),
  checker_id TEXT REFERENCES reviewers(id),
  status TEXT NOT NULL CHECK (status IN ('PROPOSED', 'APPROVED', 'REJECTED')),
  justification TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Architectural Constraint: Maker cannot check their own proposal
  CONSTRAINT check_maker_checker_distinct 
    CHECK (checker_id IS NULL OR maker_id <> checker_id)
);

-- Append-Only Cryptographic Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL
);

-- Append-Only Trigger: Prohibit UPDATE and DELETE on audit_log
CREATE OR REPLACE FUNCTION audit_log_immutable_trigger() 
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is strictly append-only. Modification and deletion are prohibited by database security policy.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_log_immutable ON audit_log;
CREATE TRIGGER trigger_audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_immutable_trigger();

-- ============================================================================
-- 4. PUBLIC VIEWS (PRIVACY BY STRUCTURE)
-- Public access ONLY through these views. Zero personal names, zero phone numbers.
-- ============================================================================

CREATE OR REPLACE VIEW view_public_villages AS
SELECT 
  v.id,
  v.code,
  v.name_kn,
  v.name_en,
  v.district,
  v.taluk,
  v.hobli,
  COUNT(DISTINCT p.id) AS total_parcels_cataloged,
  COUNT(DISTINCT CASE WHEN p.tier <> 'T0_REPORTED' THEN p.id END) AS reviewed_parcels_count,
  COUNT(DISTINCT r.id) AS citizen_reports_count
FROM villages v
LEFT JOIN parcels p ON p.village_id = v.id
LEFT JOIN reports r ON r.village_id = v.id
GROUP BY v.id, v.code, v.name_kn, v.name_en, v.district, v.taluk, v.hobli;

CREATE OR REPLACE VIEW view_public_parcels AS
SELECT 
  p.id,
  p.village_id,
  p.survey_number,
  p.hissa,
  p.baseline_tenure,
  p.current_tenure,
  p.gross_extent_anas,
  extent_from_anas(p.gross_extent_anas) AS formatted_extent,
  p.tier,
  p.wording_code,
  p.published
FROM parcels p
WHERE p.published = TRUE;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & ROLE GRANTS
-- ============================================================================

ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 1. app_public: Access ONLY to public views
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_public;
GRANT SELECT ON view_public_villages TO app_public;
GRANT SELECT ON view_public_parcels TO app_public;

-- 2. app_reporter: INSERT ONLY on reports and report_media
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_reporter;
GRANT INSERT ON reports TO app_reporter;
GRANT INSERT ON report_media TO app_reporter;
GRANT INSERT ON report_contacts TO app_reporter;

-- 3. app_reviewer: Reviewer operations (no direct crypto key access)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_reviewer;
GRANT SELECT, INSERT, UPDATE ON parcels TO app_reviewer;
GRANT SELECT, INSERT ON documents TO app_reviewer;
GRANT SELECT, INSERT ON record_entries TO app_reviewer;
GRANT SELECT, INSERT ON records TO app_reviewer;
GRANT SELECT, INSERT ON rule_results TO app_reviewer;
GRANT SELECT, INSERT, UPDATE ON tasks TO app_reviewer;
GRANT SELECT, INSERT, UPDATE ON tier_change_requests TO app_reviewer;
GRANT SELECT, INSERT ON audit_log TO app_reviewer; -- INSERT only, cannot modify audit log

-- 4. app_admin: Full migration and maintenance
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;
