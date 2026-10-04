# Data Protection and Privacy Policy (Gomala Atlas)
<!-- STATUS: TO BE COMPLETED WITH LEGAL REVIEW -->

## 1. Data Controller
- **Organization / Entity:** Gomala Atlas Research Consortium / Registered Partner Society
- **Designated Data Protection Officer:** [TO BE COMPLETED WITH LEGAL REVIEW]
- **Contact Email:** privacy-takedown@gomala-atlas.local
- **Postal Address:** [TO BE COMPLETED WITH LEGAL REVIEW]
- **Takedown & Correction Officer:** Advocate N. Rao, Grievance Redressal Nominee (State Bar Council Reg. Verified)

## 2. Purposes of Data Processing
1. Documentation and technical triage of public land revenue records (RTC / Pahani) for village common pasture lands (Gomala).
2. Facilitating volunteer double-entry comparison of government records.
3. Neutral generation of Right to Information (RTI) queries and revenue office verification requests.
4. Archiving public village-level statistical aggregates for civic awareness and research.

## 3. Data Categories & Structural Privacy Boundaries
- **Public Surface:** Village-level aggregates, parcel survey identifiers ONLY after meeting all 4 publishing gates.
- **Strictly Non-Public (Zero Public Access):**
  - Personal names of landholders / khatedars (always encrypted at rest with envelope encryption).
  - Phone numbers, email addresses, and contact info of anonymous reporters.
  - High-precision GPS coordinates from citizen report metadata (stripped server-side).
  - Drafts, unreviewed records, raw discrepancy notes.
- **Database Separation:** Enforced by PostgreSQL Row-Level Security (RLS) and distinct connection roles (`app_public`, `app_reporter`, `app_reviewer`, `app_admin`).

## 4. Retention Periods
- **Citizen Report Contact Details:** Encrypted at rest; deleted within 180 days of report closure unless explicit ongoing communication is approved by reporter.
- **Tracking Codes:** 128-bit random codes; only HMAC-SHA256 stored; cannot be reversed.
- **Audit Logs:** Immutable append-only cryptographic hash chain retained indefinitely for accountability.
- **Public Records:** Public view contains only certified government record extracts and confirmed status.

## 5. Citizen Consent Text (Displayed on Report Form)
> "By submitting this information, you confirm that your contribution is for documentation and record verification purposes. No personal accusations are permitted. Your contact details (if provided) are encrypted and never shown to the public. You will receive a one-time 128-bit tracking code to follow your submission."

## 6. Correction and Takedown Procedure
Any interested party or landholder may request immediate correction or takedown if an entry contains factual errors or infringes statutory privacy rights:
1. Online Takedown Form available on all village and parcel pages.
2. Verified by Takedown Officer within 72 hours.
3. Every takedown is logged in the append-only cryptographic audit chain.
