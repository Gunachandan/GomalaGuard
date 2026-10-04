# Gomala Atlas Architectural & Domain Decisions Log

## What We Did NOT Assume (Explicit Non-Assumptions)
1. **Did not assume column numbers for RTCs:** In Karnataka Bhoomi and legacy pahani records, column arrangements, kharab classifications, and layout vary across revisions (e.g., column 9 vs 11 for khatedar, column 3 for extent). We strictly map fields through `config/record_format.yaml` keys.
2. **Did not assume Kharab A vs Kharab B deductions:** We did not assume all kharab is subtracted from gross extent automatically. Only when kharab definitions and rules are explicitly `CONFIRMED` in config is net extent calculated; otherwise rules use the configured comparison basis or flag `NOT_CHECKABLE`.
3. **Did not assume any statutory section numbers or penalty clauses from memory:** All legal citations are grounded in `config/legal_facts.yaml`. If not confirmed by a legal reviewer, we render `[CITATION TO BE CONFIRMED BY LEGAL REVIEWER]`.
4. **Did not assume lack of an order implies wrongdoing:** Absence of an order in the database is strictly treated as `CHANGE_OBSERVED` ("No linked order was found among the documents entered. Verification is requested."). It is never marked `CONTRADICTED` unless an official RTI reply of type `ORDER_STATED_NOT_ISSUED` is verifier-confirmed.
5. **Did not assume "Information Not Available" means no order was issued:** When a taluk office replies that records are not found or untraceable, it returns `NOT_CHECKABLE` and triggers follow-up appeal tasks; it never marks the parcel contradicted.
6. **Did not assume sub-division list is complete without reviewer certification:** Even if child parcels add up to less than the parent extent, R1 returns `NOT_CHECKABLE` (reason: `child_list_not_confirmed_complete`) unless `children_complete` has been explicitly marked by a reviewer.
7. **Did not assume default area tolerance:** System ships with `TOL_ABS_ANAS = 0` and `TOL_REL_BP = 0` and displays a persistent warning banner ("Tolerance not calibrated") until calibrated with real village pilot data.
8. **Did not assume float arithmetic is acceptable for land area:** All extent calculations are strictly integer operations on **anas** (1 Acre = 40 Guntas = 640 Anas). Ceiling rounding uses integer math `(product + 9999) / 10000`. Any subtraction below zero throws an error.
9. **Did not assume synthetic parcel polygons belong on public maps:** Synthetic parcel boundaries or speculative GIS parcel shapes are strictly removed from the public atlas view. Only village-level aggregates and certified survey-settlement maps with prominent boundary disclaimers are presented publicly.
10. **Did not assume synthetic golden sets can unlock publication:** Synthetic test fixtures are strictly prevented from unlocking the publishing gate. Gate 4 requires `provenance: 'human_verified'` signed by a qualified surveyor.
11. **Did not assume citizens should be blocked by language scanners:** While public export templates and published texts strictly block banned or accusatory vocabulary, incoming citizen reports with colloquial complaints are accepted, issued a private tracking code, and flagged for neutral moderator triage.

## Full-Stack Implementation Slices
- **Slice 1 (Extent Library & Vectors):** Integer Anas arithmetic (`ExtentService`), `1A-0G-0A = 640 anas`, negative subtraction throws `Negative extent subtraction refused`, integer tolerance with ceiling rounding, 10,000 seeded deterministic round-trips verified.
- **Slice 2 (Schema, Roles, RLS & Crypto-Audit):** Cryptographic SHA-256 hash-chained append-only audit log with concurrency write lock, envelope encryption for sensitive fields, 128-bit random tracking codes stored strictly as HMAC-SHA256 with constant-time lookup.
- **Slice 3 (Rule Engine R1-R3):** Versioned pure server functions (`RuleEngineService`), two-document constraint on `CONTRADICTED`, "system tolerance" phrasing, task generation deduplicated by parcel+reason.
- **Slice 4 (Double Entry & Desktop Reviewer Console):** Two-entrant capture from `record_format.yaml`, live extent arithmetic preview, side-by-side document viewer, Verifier resolution with mandatory audit reason, Maker-Checker tier progression (`maker_id != checker_id`).
- **Slice 5 (Reporter PWA):** Mobile-first Kannada/English PWA, offline draft queue with sync, server-side EXIF/GPS metadata stripping, non-blocking moderation flagging.
- **Slice 6 (Public Pages, Publishing Gate, Templates & Scanner):** Village aggregate layer, 4 publishing gates (with response window & human-verified provenance enforcement), neutral RTI & Verification Memo templates, Banned Terms Scanner.
- **Slice 7 (Full-Stack Express Server):** Express server (`server.ts`) hosting API routes `/api/reports`, `/api/publish-gate/verify`, `/api/audit-log`, and `/api/extent/calculate` with Vite middleware mounted in dev.

## Security Review Checklist
1. `server.ts`:
   - Verify that `SERVER_HMAC_SECRET` and `SERVER_ENCRYPTION_KEY` are isolated in server process memory and never serialized into client JavaScript.
   - Verify that EXIF stripping removes `0xFFE1` APP1 segments before storing file hashes.
   - Verify that concurrent audit log writes are serialized via write queue to prevent chain forks.
2. `src/services/dataService.ts` & `server.ts`:
   - Confirm Gate 4 strictly requires `golden_set_provenance === 'human_verified'`.
   - Confirm Gate 2 calculates elapsed days against `RESPONSE_WINDOW_DAYS` (default 30).
   - Confirm Maker-Checker constraint (`maker_id != checker_id`).
