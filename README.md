# Gomala Atlas (ಗೋಮಾಳ ಅಟ್ಲಾಸ್) v2

A triage and documentation platform for village pasture land (*Gomala*) records in Karnataka, India.

It records what official documents show, compares them with deterministic rules, and prepares neutral questions for the proper revenue authority. It does not make findings about people and it never contacts an authority automatically.

---

## 1. Core Principles

1. **Documents over transcriptions:** Discrepancies point to source documents, not typed values.
2. **Absence of evidence is not evidence:** "We could not check" is a first-class result (`NOT_CHECKABLE`) with an attached task.
3. **Humans decide:** Rules compute; reviewers approve evidence tiers; nothing is filed with an authority automatically.
4. **Privacy by structure:** Database roles (`app_public`, `app_reporter`, `app_reviewer`, `app_admin`), row-level security (RLS), and envelope encryption ensure personal names and contacts are never exposed to public views.
5. **Deterministic & Reproducible:** Every rule result stores rule version, input record IDs, input document IDs, config hashes, and timestamps.
6. **No accusations:** The words fraud, forged, illegal, grabber, encroacher, criminal, scam, and their Kannada equivalents are banned by automated compliance scanners.

---

## 2. System Architecture

```text
 Reporter (phone PWA)            Entrant / Moderator / Verifier (desktop console)
        │                                     │
        └──────────────┬──────────────────────┘
                       ▼
        ┌──────────────────────────────────┐
        │       Gomala Atlas App           │
        │  - Kannada (kn) / English (en)   │
        │  - Offline draft queue           │
        │  - Double-entry capture & diff   │
        └───┬───────────┬──────────────┬───┘
            │           │              │
            ▼           ▼              ▼
   ┌────────────┐ ┌─────────────┐ ┌──────────────────┐
   │ Rule Engine│ │ File Service│ │ Crypto Service   │
   │ (R1, R2,   │ │ - strip EXIF│ │ - envelope enc.  │
   │  R3 server)│ │ - SHA-256   │ │ - hash audit log │
   └─────┬──────┘ └──────┬──────┘ └────────┬─────────┘
         │               │                 │
         ▼               ▼                 ▼
   ┌─────────────────────────────────────────────────┐
   │ PostgreSQL 15+ Schema & RLS (migrations/)       │
   │ - Base tables + RLS                             │
   │ - Append-only trigger on audit_log              │
   │ - Public views (zero names, zero contacts)      │
   └─────────────────────────────────────────────────┘
```

---

## 3. Extent Arithmetic (Anas Standard)

Area is strictly calculated and stored as an integer count of **anas**:
- 1 Acre = 40 Guntas
- 1 Gunta = 16 Anas
- 1 Acre = 640 Anas
- Zero floating-point arithmetic.
- Subtraction below zero throws `Negative extent subtraction refused`.
- Tolerance: `tolerance_anas = max(TOL_ABS_ANAS, ceil(parent_anas * TOL_REL_BP / 10000))`. Default ships as `(0, 0)` with uncalibrated banner until golden set calibration.

---

## 4. Pure Rule Engine (R1–R3)

- **R1: Sub-division extent balance:** Evaluates whether sum of child hissa extents exceeds parent parcel extent beyond system tolerance. Over-sum returns `CONTRADICTED` (requires $\ge 2$ documents). Under-sum with incomplete list returns `NOT_CHECKABLE`.
- **R2: Tenure change vs baseline:** Compares baseline classification (GOMAL) with current record. Absence of an order returns `CHANGE_OBSERVED`. An official RTI reply of type `ORDER_STATED_NOT_ISSUED` (verifier-confirmed) returns `CONTRADICTED`.
- **R3: Mutation reference present:** Checks whether tenure change has an attached mutation register reference.

---

## 5. Verification & Running Acceptance Tests

Run the full acceptance test suite:
```bash
npx tsx scripts/run_acceptance_suite.ts
```

Output:
```text
TEST SUITE SUMMARY: 41/41 TESTS PASSED (0 failures)
```

Compile and lint the applet:
```bash
npm run lint
npm run build
```

---

## 6. Repository Structure

```text
├── config/
│   ├── banned_terms.yaml        # English & Kannada prohibited vocabulary
│   ├── legal_facts.yaml         # Grounded legal claims (UNCONFIRMED placeholders)
│   ├── public_phrases.yaml      # Approved neutral public phrasing
│   ├── record_format.yaml       # Pahani field keys and comparison basis
│   └── rti_reply_types.yaml     # Controlled RTI response classification
├── docs/
│   └── data-protection.md       # Data controller & takedown procedure
├── migrations/
│   └── 001_initial_schema.sql   # PostgreSQL schema, 4 roles, RLS, functions
├── scripts/
│   └── run_acceptance_suite.ts  # Complete 41-case acceptance test suite
├── src/
│   ├── components/              # Public Atlas, Reporter PWA, Double Entry, etc.
│   ├── services/                # Rule engine, Extent, Crypto/Audit, Scanner
│   ├── types/                   # Domain TypeScript definitions
│   └── App.tsx
├── tests/
│   ├── golden/                  # Hand-verified golden village datasets
│   └── vectors/extent.json      # Shared extent test vectors
└── DECISIONS.md                 # Architectural decisions & non-assumptions log
```

---

## 7. Pushing to your GitHub Repository

To push this repository to your GitHub account:

1. Create a new repository on GitHub (e.g. `gomala-atlas`).
2. Add your remote and push:
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```
