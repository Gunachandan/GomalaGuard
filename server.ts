/**
 * Gomala Atlas v2 - Full-Stack Express Server
 * 
 * Provides true server-side security, cryptographic secrets isolation,
 * publishing gate enforcement, EXIF stripping, and hash-chained audit logging.
 */

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// ============================================================================
// 1. TRUE SERVER-SIDE SECRETS (Isolated from Browser Client)
// ============================================================================
const SERVER_HMAC_SECRET = process.env.SERVER_HMAC_SECRET || crypto.randomBytes(32).toString('hex');
const SERVER_ENCRYPTION_KEY = process.env.SERVER_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const RESPONSE_WINDOW_DAYS = parseInt(process.env.RESPONSE_WINDOW_DAYS || '30', 10);

console.log('[Server] Cryptographic secrets initialized in server memory (unexposed to browser bundle).');
console.log(`[Server] Configured RESPONSE_WINDOW_DAYS = ${RESPONSE_WINDOW_DAYS}`);

// ============================================================================
// 2. AUDIT LOG SERIALIZATION WITH CONCURRENCY WRITE LOCK
// ============================================================================
interface ServerAuditRow {
  index: number;
  timestamp: string;
  prev_hash: string;
  hash: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_id: string;
  details: string;
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
let serverAuditChain: ServerAuditRow[] = [
  {
    index: 0,
    timestamp: new Date().toISOString(),
    prev_hash: GENESIS_HASH,
    hash: crypto.createHash('sha256').update(GENESIS_HASH + 'GENESIS_SERVER_INIT').digest('hex'),
    actor_id: 'system',
    actor_name: 'System Bootstrapper',
    action: 'SYSTEM_BOOT',
    target_id: 'gomala-atlas-v2',
    details: 'System initialized with secure server-side cryptographic audit chain.',
  },
];

let isWritingAuditLog = false;
const writeQueue: Array<() => Promise<void>> = [];

async function appendServerAuditLog(params: {
  actor_id: string;
  actor_name: string;
  action: string;
  target_id: string;
  details: string;
}): Promise<ServerAuditRow> {
  return new Promise((resolve) => {
    const task = async () => {
      const prevRow = serverAuditChain[serverAuditChain.length - 1];
      const index = prevRow.index + 1;
      const timestamp = new Date().toISOString();
      const payloadToHash = `${prevRow.hash}|${index}|${timestamp}|${params.actor_id}|${params.action}|${params.target_id}|${params.details}`;
      const hash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

      const newRow: ServerAuditRow = {
        index,
        timestamp,
        prev_hash: prevRow.hash,
        hash,
        actor_id: params.actor_id,
        actor_name: params.actor_name,
        action: params.action,
        target_id: params.target_id,
        details: params.details,
      };

      serverAuditChain.push(newRow);
      resolve(newRow);
    };

    writeQueue.push(task);
    processAuditQueue();
  });
}

async function processAuditQueue() {
  if (isWritingAuditLog || writeQueue.length === 0) return;
  isWritingAuditLog = true;
  const currentTask = writeQueue.shift();
  if (currentTask) {
    try {
      await currentTask();
    } finally {
      isWritingAuditLog = false;
      if (writeQueue.length > 0) {
        processAuditQueue();
      }
    }
  }
}

// ============================================================================
// 3. EXIF METADATA STRIPPER (SERVER-SIDE)
// ============================================================================
function stripExifMetadata(buffer: Buffer): Buffer {
  // If JPEG (starts with 0xFFD8)
  if (buffer.length > 4 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2;
    const pieces: Buffer[] = [buffer.subarray(0, 2)]; // Start of Image marker
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xFF) break;
      const marker = buffer[offset + 1];
      // 0xFFDA is Start of Scan (image data follows)
      if (marker === 0xDA) {
        pieces.push(buffer.subarray(offset));
        break;
      }
      const length = buffer.readUInt16BE(offset + 2);
      // Skip APP1 (0xFFE1 - EXIF/XMP) and APP2 (0xFFE2)
      if (marker === 0xE1 || marker === 0xE2) {
        offset += 2 + length;
        continue;
      }
      pieces.push(buffer.subarray(offset, offset + 2 + length));
      offset += 2 + length;
    }
    return Buffer.concat(pieces);
  }
  return buffer;
}

// ============================================================================
// 4. API ROUTES
// ============================================================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    architecture: 'full-stack-express-vite',
    server_time: new Date().toISOString(),
    response_window_days: RESPONSE_WINDOW_DAYS,
    audit_chain_length: serverAuditChain.length,
  });
});

// Audit log view & verification
app.get('/api/audit-log', (req: Request, res: Response) => {
  res.json({
    chain: serverAuditChain,
    valid: verifyChainIntegrity(),
  });
});

function verifyChainIntegrity(): boolean {
  for (let i = 1; i < serverAuditChain.length; i++) {
    const prev = serverAuditChain[i - 1];
    const curr = serverAuditChain[i];
    if (curr.prev_hash !== prev.hash) return false;
    const payload = `${prev.hash}|${curr.index}|${curr.timestamp}|${curr.actor_id}|${curr.action}|${curr.target_id}|${curr.details}`;
    const calculated = crypto.createHash('sha256').update(payload).digest('hex');
    if (curr.hash !== calculated) return false;
  }
  return true;
}

// Citizen report submission with EXIF stripping and Non-Defamatory Moderation Queue
interface StoredReport {
  id: string;
  tracking_hmac: string;
  village_id: string;
  survey_number: string;
  description: string;
  file_hash?: string;
  moderation_status: 'APPROVED' | 'FLAGGED_FOR_MODERATION';
  flagged_terms: string[];
  created_at: string;
}

const serverReports: StoredReport[] = [];

// Banned words list for neutral flagging
const BANNED_WORDS = [
  'fraud', 'forged', 'illegal', 'grabber', 'land grab', 'encroacher', 'encroachment',
  'criminal', 'scam', 'corrupt', 'corruption', 'thief', 'ಅಕ್ರಮ', 'ಕಬಳಿಕೆ', 'ಒತ್ತುವರಿ', 'ವಂಚನೆ', 'ಹಗರಣ'
];

app.post('/api/reports', async (req: Request, res: Response) => {
  try {
    const { villageId, surveyNumber, description, photoBase64, contact } = req.body;

    if (!villageId || !description) {
      return res.status(400).json({ error: 'villageId and description are required' });
    }

    // 1. Server-side EXIF stripping
    let fileHash: string | undefined = undefined;
    if (photoBase64) {
      const rawBuf = Buffer.from(photoBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const sanitizedBuf = stripExifMetadata(rawBuf);
      fileHash = crypto.createHash('sha256').update(sanitizedBuf).digest('hex');
    }

    // 2. Term Scanner: We DO NOT reject incoming citizen reports!
    // Instead we tag them for moderator review to preserve neutral public publication.
    const lowerDesc = description.toLowerCase();
    const flaggedTerms = BANNED_WORDS.filter(w => lowerDesc.includes(w.toLowerCase()));
    const moderation_status = flaggedTerms.length > 0 ? 'FLAGGED_FOR_MODERATION' : 'APPROVED';

    // 3. Cryptographic Tracking Token: 128-bit random token
    const plainTrackingCode = crypto.randomBytes(16).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-') || 'CODE-ERR';
    const trackingHmac = crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(plainTrackingCode).digest('hex');
    const reportId = `rep-srv-${Date.now().toString(36)}`;

    const newReport: StoredReport = {
      id: reportId,
      tracking_hmac: trackingHmac,
      village_id: villageId,
      survey_number: surveyNumber || 'Unspecified',
      description,
      file_hash: fileHash,
      moderation_status,
      flagged_terms: flaggedTerms,
      created_at: new Date().toISOString(),
    };

    serverReports.push(newReport);

    await appendServerAuditLog({
      actor_id: 'anonymous_reporter',
      actor_name: 'Citizen Reporter',
      action: 'SUBMIT_CITIZEN_REPORT',
      target_id: reportId,
      details: `Report recorded for village ${villageId}, Sy ${surveyNumber}. Moderation: ${moderation_status}.`,
    });

    res.json({
      success: true,
      reportId,
      plainTrackingCode, // Handed back once to reporter; server retains ONLY HMAC
      moderation_status,
      advisoryNote: flaggedTerms.length > 0
        ? 'Your report has been received and routed to a reviewer to verify neutral documentation.'
        : 'Your report has been recorded anonymously.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Constant-time tracking lookup
app.post('/api/reports/track', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Tracking code required' });

  const targetHmac = crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(code.trim()).digest('hex');
  const targetBuffer = Buffer.from(targetHmac, 'hex');

  const found = serverReports.find(r => {
    const reportBuffer = Buffer.from(r.tracking_hmac, 'hex');
    return targetBuffer.length === reportBuffer.length && crypto.timingSafeEqual(targetBuffer, reportBuffer);
  });

  if (!found) {
    return res.status(404).json({ error: 'Report not found with the provided tracking code' });
  }

  res.json({
    id: found.id,
    village_id: found.village_id,
    survey_number: found.survey_number,
    status: found.moderation_status === 'FLAGGED_FOR_MODERATION' ? 'UNDER_REVIEW' : 'VERIFIED_ENTRY',
    created_at: found.created_at,
  });
});

// ============================================================================
// 5. SERVER-SIDE PUBLISHING GATE (Strict 4 Conditions)
// ============================================================================
interface GateEvaluationRequest {
  parcelId: string;
  makerId: string;
  checkerId: string;
  officeRequestSentDate?: string;
  officeResponseReceived?: boolean;
  responseWindowDays?: number;
  wordingCode?: string;
  goldenSetProvenance?: {
    status: 'synthetic' | 'human_verified';
    verified_by?: string;
    date?: string;
  };
}

export function evaluatePublishingGate(req: GateEvaluationRequest): {
  canPublish: boolean;
  gates: {
    gate1_makerChecker: boolean;
    gate2_officeWindow: boolean;
    gate3_wordingApproved: boolean;
    gate4_goldenSetVerified: boolean;
  };
  reasons: string[];
} {
  const reasons: string[] = [];

  // Gate 1: Maker-Checker approval (two distinct human identities)
  const gate1_makerChecker = !!(req.makerId && req.checkerId && req.makerId !== req.checkerId);
  if (!gate1_makerChecker) {
    reasons.push('Gate 1 Failed: Independent Maker and Checker approval required (makerId != checkerId).');
  }

  // Gate 2: Office request window elapsed (configured RESPONSE_WINDOW_DAYS, default 30)
  const windowDays = req.responseWindowDays || RESPONSE_WINDOW_DAYS;
  let gate2_officeWindow = false;

  if (req.officeResponseReceived) {
    gate2_officeWindow = true;
  } else if (req.officeRequestSentDate) {
    const sentTime = new Date(req.officeRequestSentDate).getTime();
    const now = Date.now();
    const elapsedDays = Math.floor((now - sentTime) / (1000 * 60 * 60 * 24));
    if (elapsedDays >= windowDays) {
      gate2_officeWindow = true;
    } else {
      reasons.push(`Gate 2 Failed: Office response window has not elapsed (${elapsedDays}/${windowDays} days passed).`);
    }
  } else {
    reasons.push('Gate 2 Failed: No verification request or RTI recorded with proof document.');
  }

  // Gate 3: Wording from approved public phrases
  const APPROVED_PHRASE_CODES = ['PHRASE_UNCONFIRMED_CHANGE', 'PHRASE_EXTENT_DISCREPANCY', 'PHRASE_CONSISTENT_RECORD'];
  const gate3_wordingApproved = !!(req.wordingCode && APPROVED_PHRASE_CODES.includes(req.wordingCode));
  if (!gate3_wordingApproved) {
    reasons.push('Gate 3 Failed: Public description must use an approved canonical phrase code.');
  }

  // Gate 4: Golden set verification AND human_verified provenance
  // Synthetic data is strictly REFUSED from unlocking publishing!
  let gate4_goldenSetVerified = false;
  if (!req.goldenSetProvenance) {
    reasons.push('Gate 4 Failed: No golden set calibration record provided for village.');
  } else if (req.goldenSetProvenance.status === 'synthetic') {
    reasons.push('Gate 4 Failed: Golden set is synthetic. Field studies signed by a human surveyor are required.');
  } else if (req.goldenSetProvenance.status === 'human_verified') {
    gate4_goldenSetVerified = true;
  } else {
    reasons.push(`Gate 4 Failed: Invalid golden set provenance '${(req.goldenSetProvenance as any).status}'.`);
  }

  const canPublish = gate1_makerChecker && gate2_officeWindow && gate3_wordingApproved && gate4_goldenSetVerified;

  return {
    canPublish,
    gates: {
      gate1_makerChecker,
      gate2_officeWindow,
      gate3_wordingApproved,
      gate4_goldenSetVerified,
    },
    reasons,
  };
}

app.post('/api/publish-gate/verify', async (req: Request, res: Response) => {
  const result = evaluatePublishingGate(req.body);
  if (result.canPublish) {
    await appendServerAuditLog({
      actor_id: req.body.checkerId || 'system',
      actor_name: 'Checker / Gate Enforcer',
      action: 'PUBLISHING_GATE_PASSED',
      target_id: req.body.parcelId,
      details: `All 4 gates passed for parcel ${req.body.parcelId}. Verified by ${req.body.goldenSetProvenance?.verified_by}.`,
    });
  }
  res.json(result);
});

// ============================================================================
// 6. SQL EXTENT ARITHMETIC PARITY ENDPOINT
// ============================================================================
app.post('/api/extent/calculate', (req: Request, res: Response) => {
  const { acres, guntas, anas } = req.body;
  if (acres < 0 || guntas < 0 || anas < 0) {
    return res.status(400).json({ error: 'Negative extent values are not permitted' });
  }
  const totalAnas = acres * 640 + guntas * 16 + anas;
  res.json({ totalAnas });
});

// ============================================================================
// 7. VITE MIDDLEWARE IN DEV OR STATIC SERVING IN PRODUCTION
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted for seamless development.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Gomala Atlas full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

// Start if executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('[Server] Failed to start:', err);
  });
}

export { app, appendServerAuditLog, verifyChainIntegrity, stripExifMetadata };
