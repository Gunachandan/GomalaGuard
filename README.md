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
6. **No accusations:** The words fraud, forged, illegal, grabber, encroacher, criminal, scam, and their Kannada equivalents are banned by automated compliance scanners for all public text and export templates. Citizen reports containing evaluative words are accepted but routed to a human reviewer moderation queue.

---

## 2. Full-Stack System Architecture

```text
 Reporter (phone PWA)            Entrant / Moderator / Verifier (desktop console)
        │                                     │
        └──────────────┬──────────────────────┘
                       ▼
        ┌──────────────────────────────────┐
        │  Full-Stack Express API Server   │
        │  (server.ts on Node.js/Express)  │
        │  - True server-side secrets      │
        │  - Server EXIF/GPS stripper      │
        │  - Server publishing gate check  │
        │  - Serialized SHA-256 audit log  │
        │  - Constant-time HMAC lookup     │
        └──────────────┬───────────────────┘
                       │
        ┌──────────────┴───────────────────┐
        │  Vite React Single Page App      │
        │  - Kannada (kn) / English (en)   │
        │  - Offline draft queue           │
        │  - Double-entry capture & diff   │
        │  - Zero secrets in client bundle │
        └──────────────────────────────────┘
```

---

## 3. Extent Arithmetic (Anas Standard)

Area is strictly calculated and stored as an integer count of **anas**:
- 1 Acre = 40 Guntas
- 1 Gunta = 16 Anas
- 1 Acre = 640 Anas
- **Zero floating-point arithmetic:** Extent math uses pure integer division with ceiling: `Math.floor((parent * bp + 9999) / 10000)`.
- Subtraction below zero throws `Negative extent subtraction refused`.
- Tolerance: `tolerance_anas = max(TOL_ABS_ANAS, Math.floor((parent_anas * TOL_REL_BP + 9999) / 10000))`. Default ships as `(0, 0)` with an uncalibrated warning banner until golden set calibration.

---

## 4. Pure Rule Engine (R1–R3)

- **R1: Sub-division extent balance:** Evaluates whether sum of child hissa extents exceeds parent parcel extent beyond system tolerance. Over-sum returns `CONTRADICTED` (requires $\ge 2$ documents). Under-sum with incomplete list returns `NOT_CHECKABLE`.
- **R2: Tenure change vs baseline:** Compares baseline classification (GOMAL) with current record. Absence of an order returns `CHANGE_OBSERVED`. An official RTI reply of type `ORDER_STATED_NOT_ISSUED` (verifier-confirmed) without an order returns `CONTRADICTED`. Conflicting order + RTI reply returns `NOT_CHECKABLE` for senior verifier inspection.
- **R3: Mutation reference present:** Checks whether tenure change has an attached mutation register reference.

---

## 5. Publishing Gate (4 Strict Conditions)

Before any parcel observation or report can be displayed on the public atlas:
1. **Maker-Checker Approval:** Two distinct reviewer identities (`maker_id != checker_id`).
2. **Office Request Response Window:** Verification request or RTI filed with proof document AND `RESPONSE_WINDOW_DAYS` (default: 30 days) has elapsed without response, or response received.
3. **Approved Canonical Wording:** Wording matches approved public phrases; banned terms scanner verified.
4. **Human-Verified Golden Set Calibration:** Village golden set must have `provenance: 'human_verified'`. Synthetic fixtures are strictly refused.

---

## 6. Verification & Test Suite

Run the full acceptance and SQL parity test suite:
```bash
npm test
```

Build the application for production:
```bash
npm run build
```

Run in development mode:
```bash
npm run dev
```

---

## 7. License

MIT License. See [LICENSE](LICENSE) for details.
