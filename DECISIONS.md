# Gomala Atlas Architectural & Domain Decisions Log

## What We Did NOT Assume (Explicit Non-Assumptions)
1. **Did not assume column numbers for RTCs:** In Karnataka Bhoomi and legacy pahani records, column arrangements, kharab classifications, and layout vary across revisions (e.g., column 9 vs 11 for khatedar, column 3 for extent). We strictly map fields through `config/record_format.yaml` keys.
2. **Did not assume Kharab A vs Kharab B deductions:** We did not assume all kharab is subtracted from gross extent automatically. Only when kharab definitions and rules are explicitly `CONFIRMED` in config is net extent calculated; otherwise rules use the configured comparison basis or flag `NOT_CHECKABLE`.
3. **Did not assume any statutory section numbers or penalty clauses from memory:** All legal citations are grounded in `config/legal_facts.yaml`. If not confirmed by a legal reviewer, we render `[CITATION TO BE CONFIRMED BY LEGAL REVIEWER]`.
4. **Did not assume lack of an order implies wrongdoing:** Absence of an order in the database is strictly treated as `CHANGE_OBSERVED` ("No linked order was found among the documents entered. Verification is requested."). It is never marked `CONTRADICTED` unless an official RTI reply of type `ORDER_STATED_NOT_ISSUED` is verifier-confirmed.
5. **Did not assume "Information Not Available" means no order was issued:** When a taluk office replies that records are not found or untraceable, it returns `NOT_CHECKABLE` and triggers follow-up appeal tasks; it never marks the parcel contradicted.
6. **Did not assume sub-division list is complete without reviewer certification:** Even if child parcels add up to less than the parent extent, R1 returns `NOT_CHECKABLE` (reason: `child_list_not_confirmed_complete`) unless `children_complete` has been explicitly marked by a reviewer.
7. **Did not assume default area tolerance:** System ships with `TOL_ABS_ANAS = 0` and `TOL_REL_BP = 0` and displays a persistent warning banner ("Tolerance not calibrated") until calibrated with real village pilot data.
8. **Did not assume float arithmetic is acceptable for land area:** All extent calculations are strictly integer operations on **anas** (1 Acre = 40 Guntas = 640 Anas). Any subtraction below zero throws an error.

## Implemented Architecture & Completed Slices (1 through 6)
- **Slice 1 (Extent Library & Vectors):** Integer Anas arithmetic (`ExtentService`), `1A-0G-0A = 640 anas`, negative subtraction throws `Negative extent subtraction refused`, integer tolerance with ceiling rounding, 10,000 seeded deterministic round-trips verified.
- **Slice 2 (Schema, Roles, RLS & Crypto-Audit):** Cryptographic SHA-256 hash-chained append-only audit log (`CryptoAuditService`), envelope encryption for khatedar names & reporter contacts, 128-bit random tracking codes stored strictly as HMAC-SHA256 with constant-time lookup.
- **Slice 3 (Rule Engine R1-R3):** Versioned pure server functions (`RuleEngineService`), two-document constraint on `CONTRADICTED`, "system tolerance" phrasing, task generation deduplicated by parcel+reason.
- **Slice 4 (Double Entry & Desktop Reviewer Console):** Two-entrant capture from `record_format.yaml`, live extent arithmetic preview, side-by-side document viewer, Verifier resolution with mandatory audit reason, Maker-Checker tier progression (`maker_id != checker_id`).
- **Slice 5 (Reporter PWA):** Mobile-first Kannada/English PWA, offline draft queue with sync, server-side EXIF/GPS metadata stripping, corroboration counting without duplicate storage.
- **Slice 6 (Public Pages, Publishing Gate, Templates & Scanner):** Village aggregate layer, cadastral parcel map, 4 publishing gates, neutral RTI & Verification Memo templates, Banned Terms Scanner (English + Kannada), and golden set calibration runner.

## Security Review Checklist (Slice 2 & Slice 5)
A security reviewer should inspect the following diffs and safeguards:
1. `src/services/cryptoAuditService.ts`:
   - Verify that plain tracking codes are never persisted; only `HMAC-SHA256(code, server_secret)` is saved.
   - Verify that `decryptSensitive` cannot be called without concurrently appending an immutable audit row with verified justification.
   - Verify `verifyChainIntegrity()` accurately detects any altered log row or broken previous-hash pointer.
2. `src/services/storageService.ts`:
   - Inspect that image processing strips EXIF/GPS coordinates permanently before any public display or storage.
   - Check that deduplication uses SHA-256 file hashes to increment corroboration counters without storing duplicate files.
3. `src/services/bannedTermsScanner.ts`:
   - Confirm regex scans text against both English and Kannada banned vocabularies to prevent defamatory or accusatory text submission.
4. `src/services/dataService.ts`:
   - Confirm the 4 Publishing Gates block public display of parcel observations until Maker-Checker approval, 30-day office request window, approved wording, and golden calibration pass.
   - Confirm Maker-Checker constraint (`maker_id != checker_id`) in tier changes.

