import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import CryptoJS from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');
const DATA_FILE = path.join(__dirname, 'data.json');

// Build Vite frontend if dist/index.html is missing
if (!fs.existsSync(INDEX_HTML)) {
  console.log('dist/index.html not found. Building Vite project automatically...');
  try {
    execSync('npx vite build', { stdio: 'inherit' });
    console.log('Build completed successfully.');
  } catch (buildErr) {
    console.error('Failed to build Vite project:', buildErr);
  }
}

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || "https://umfhzompkgtmwxehgmvd.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || Buffer.from('c2JfcHVibGlzaGFibGVfN0FMMUlmLWtmS21aRzlLUTNoQWlRVF90SUkxWmxZaw==', 'base64').toString('utf8');
const BUCKET_NAME = 'wellness_data';
const FILE_PATH = 'patients_encrypted.json';
const ENCRYPTION_SECRET = 'wellness-buddy-aes-key-2026-secure';

// In-Memory Patient Store
let patientsStore = [];

function encryptData(data) {
  try {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, ENCRYPTION_SECRET).toString();
  } catch (err) {
    console.error('Encryption failed:', err);
    return null;
  }
}

function decryptData(cipherText) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_SECRET);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedStr) return null;
    return JSON.parse(decryptedStr);
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
}

function filterLegacyDefaultPatients(patients) {
  if (!Array.isArray(patients)) return [];
  return patients.filter(p => {
    if (!p) return false;
    const name = String(p.name || '').toLowerCase().trim();
    const email = String(p.email || '').toLowerCase().trim();
    const id = String(p.id || '').toLowerCase().trim();
    if (name.includes('james bond') || email.includes('james.bond') || id === 'p-1' || id === 'cli_1785717959740') return false;
    if (name === 'peter c' || email.includes('peter.c') || id === 'p-2') return false;
    return true;
  });
}

function loadLocalData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        patientsStore = filterLegacyDefaultPatients(parsed);
        console.log(`⚡ Loaded ${patientsStore.length} patients from local data store.`);
      }
    } catch (e) {
      console.error("Error reading data.json:", e.message);
    }
  }
}

function saveLocalData() {
  try {
    patientsStore = filterLegacyDefaultPatients(patientsStore);
    fs.writeFileSync(DATA_FILE, JSON.stringify(patientsStore, null, 2));
  } catch (e) {
    console.error("Error writing data.json:", e.message);
  }
}

function toStableUUID(str) {
  if (!str) return "00000000-0000-4000-8000-000000000000";
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str.toLowerCase();

  let hash = BigInt(5381);
  const buf = Buffer.from(String(str), 'utf8');
  for (let i = 0; i < buf.length; i++) {
    hash = ((hash << BigInt(5)) + hash + BigInt(buf[i])) & BigInt("0xFFFFFFFFFFFFFFFF");
  }

  const h32 = Number(hash & BigInt(0xFFFFFFFF)) >>> 0;
  const h48 = Number((hash >> BigInt(32)) & BigInt(0xFFFF)) >>> 0;
  const h32b = Number((hash >> BigInt(16)) & BigInt(0xFFFF)) >>> 0;
  const h16 = Number(hash & BigInt(0xFFFF)) >>> 0;
  const h64Hex = hash.toString(16).padStart(16, '0');

  const hex1 = h32.toString(16).padStart(8, '0');
  const hex2 = h48.toString(16).padStart(4, '0');
  const hex3 = h32b.toString(16).padStart(4, '0');
  const hex4 = h16.toString(16).padStart(4, '0');
  const hex5 = h64Hex.slice(-12).padStart(12, '0');

  return `${hex1}-${hex2}-4${hex3.slice(-3)}-${hex4.slice(-4)}-${hex5.slice(-12)}`.toLowerCase();
}

async function syncWithSupabaseStorage() {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${FILE_PATH}?t=${Date.now()}`, {
      headers: { 'apikey': SUPABASE_KEY }
    });
    if (res.status === 200) {
      const payload = await res.json();
      if (payload && payload.encrypted) {
        const decrypted = decryptData(payload.encrypted);
        if (decrypted && Array.isArray(decrypted)) {
          const cleaned = filterLegacyDefaultPatients(decrypted);
          if (cleaned.length > 0) {
            // Merge deterministically
            const map = new Map();
            patientsStore.forEach(p => map.set(p.id, p));
            cleaned.forEach(p => {
              if (map.has(p.id)) {
                map.set(p.id, { ...map.get(p.id), ...p });
              } else {
                map.set(p.id, p);
              }
            });
            patientsStore = Array.from(map.values());
            saveLocalData();
          }
        }
      }
    }
  } catch (err) {}
}

// Initial load
loadLocalData();
syncWithSupabaseStorage();

function findPatient(identifier) {
  if (!identifier) return null;
  const target = String(identifier).trim().toLowerCase();
  const targetUUID = toStableUUID(target);

  return patientsStore.find(p => {
    if (!p) return false;
    const pId = String(p.id || '').trim().toLowerCase();
    const pName = String(p.name || '').trim().toLowerCase();
    const pUUID = toStableUUID(pId);
    return pId === target || pUUID === targetUUID || pName === target;
  }) || null;
}

function formatClientProfile(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    dob: p.dob || "Not specified",
    email: p.email || "",
    goal: p.primaryGoal || p.goal || "",
    symptoms: p.reportedSymptoms || p.symptoms || "",
    practitionerNote: p.guidanceNote || p.practitionerNote || ""
  };
}

function formatWebSupplement(item) {
  if (!item) return null;
  const name = item.name || "Supplement";
  const brand = item.brand || item.manufacturer || "Empower Pharma";
  const instructions = item.practitionerNotes || item.instructions || "Take as directed.";
  const timing = item.timingSchedule || item.timing || "Empty Stomach";
  const freq = item.frequencyDescription || item.frequency || "Daily";
  const id = item.id ? String(item.id) : ("s-" + Date.now() + Math.random().toString(36).substr(2, 4));

  return {
    id: id,
    name: name,
    manufacturer: brand,
    brand: brand,
    category: item.category || "Supplement",
    frequency: freq,
    recurrence: item.recurrence || "Every 24h",
    timing: timing,
    instructions: instructions,
    scheduledTime: item.scheduledTime || "08:00 AM",
    completedToday: item.completedToday || false,
    dosageValue: item.dosageValue !== undefined ? Number(item.dosageValue) : 1,
    dosageUnit: item.dosageUnit || "caps",
    timingSchedule: timing,
    frequencyDescription: freq,
    intervalHours: item.intervalHours !== undefined ? Number(item.intervalHours) : 24,
    practitionerNotes: instructions,
    totalServingsRemaining: item.totalServingsRemaining !== undefined ? Number(item.totalServingsRemaining) : 30,
    maxServings: item.maxServings !== undefined ? Number(item.maxServings) : 30,
    fullscriptRefillUrl: item.fullscriptRefillUrl || "https://us.fullscript.com/welcome/lvitti/signup"
  };
}

function formatProtocolItems(supplements) {
  if (!Array.isArray(supplements)) return [];
  return supplements.map(s => {
    if (!s) return null;
    const name = s.name || "Supplement";
    const brand = s.brand || s.manufacturer || "Empower Pharma";
    const notes = s.practitionerNotes || s.instructions || "Take as directed.";
    const timing = s.timingSchedule || s.timing || "Empty Stomach";
    const freq = s.frequencyDescription || s.frequency || "Daily";

    return {
      id: toStableUUID(s.id),
      name: name,
      brand: brand,
      category: s.category || "Supplement",
      dosageValue: s.dosageValue !== undefined ? Number(s.dosageValue) : 1.0,
      dosageUnit: s.dosageUnit || "caps",
      timingSchedule: timing,
      frequencyDescription: freq,
      intervalHours: s.intervalHours !== undefined ? Number(s.intervalHours) : 24.0,
      practitionerNotes: notes,
      totalServingsRemaining: s.totalServingsRemaining !== undefined ? Number(s.totalServingsRemaining) : 30,
      maxServings: s.maxServings !== undefined ? Number(s.maxServings) : 30,
      fullscriptRefillUrl: s.fullscriptRefillUrl || "https://us.fullscript.com/welcome/lvitti/signup"
    };
  }).filter(Boolean);
}

function getJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { resolve({}); }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // --- API ENDPOINTS ---

  // 0. HEALTH CHECK
  if (pathname === '/api/ping' && method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      timestamp: new Date().toISOString(),
      status: "live",
      database: "local_json_and_supabase"
    });
  }

  // 1. GET ALL PATIENTS / STATE
  if ((pathname === '/api/patients' || pathname === '/api/state') && method === 'GET') {
    patientsStore = filterLegacyDefaultPatients(patientsStore);
    return sendJson(res, 200, { success: true, patients: patientsStore });
  }

  // 2. SAVE STATE
  if ((pathname === '/api/patients' || pathname === '/api/state') && method === 'POST') {
    const body = await getJsonBody(req);
    const updatedPatients = body.patients || body;
    if (Array.isArray(updatedPatients)) {
      patientsStore = filterLegacyDefaultPatients(updatedPatients);
      saveLocalData();
      return sendJson(res, 200, { success: true });
    } else {
      return sendJson(res, 400, { success: false, message: "Invalid payload" });
    }
  }

  // 3. REGISTER CLIENT (Name & DOB)
  if (pathname === '/api/auth/register-client' && method === 'POST') {
    const body = await getJsonBody(req);
    const name = String(body.name || '').trim();
    if (!name) {
      return sendJson(res, 400, { success: false, message: "Full Name is required" });
    }

    const dob = (body.dob && String(body.dob).trim().length > 0) ? String(body.dob).trim() : "Not specified";
    const email = (body.email && String(body.email).trim().length > 0) ? String(body.email).trim() : (name.toLowerCase().replace(/\s+/g, '.') + "@wellnessclient.com");
    const password = body.password || "password123";

    patientsStore = filterLegacyDefaultPatients(patientsStore);

    let existing = patientsStore.find(c => 
      c && String(c.name || '').toLowerCase().trim() === name.toLowerCase() && String(c.dob || '').trim() === dob
    );

    if (existing) {
      existing.name = name;
      existing.dob = dob;
      if (body.goal) existing.primaryGoal = body.goal;
      if (body.symptoms) existing.reportedSymptoms = body.symptoms;
      saveLocalData();
      return sendJson(res, 200, { success: true, client: formatClientProfile(existing), isExisting: true });
    }

    const newClient = {
      id: "cli_" + Date.now(),
      name: name,
      dob: dob,
      email: email,
      password: password,
      status: "Pending Intake",
      isNew: true,
      primaryGoal: body.goal || "Optimize peak vitality & performance",
      reportedSymptoms: body.symptoms || "None reported",
      currentSupplements: "None",
      guidanceNote: "Waiting for your practitioner to prescribe your custom protocol.",
      practitionerName: "Luba Vitti",
      adherenceRate: 100,
      activeStreak: 0,
      dosesCompletedToday: 0,
      totalDosesToday: 0,
      supplements: [],
      adherenceLog: [
        { day: 'W', completed: false, date: '2026-07-29' },
        { day: 'T', completed: false, date: '2026-07-30' },
        { day: 'F', completed: false, date: '2026-07-31' },
        { day: 'S', completed: false, date: '2026-08-01' },
        { day: 'S', completed: false, date: '2026-08-02' },
        { day: 'M', completed: false, date: '2026-08-03' },
        { day: 'T', completed: false, date: '2026-08-04' }
      ],
      historyLogs: [
        { timestamp: "Just now", action: "Patient account registered via mobile app" }
      ],
      doctorMessages: [
        { id: "m-1", sender: "doctor", senderName: "Dr. Luba Vitti", text: `Welcome ${name}! I am reviewing your intake. Feel free to leave me a message here.`, timestamp: "Just now" }
      ]
    };

    patientsStore.unshift(newClient);
    saveLocalData();
    return sendJson(res, 200, { success: true, client: formatClientProfile(newClient), isNew: true });
  }

  // 4. LOGIN CLIENT (Name & DOB OR Email & Password)
  if (pathname === '/api/auth/login-client' && method === 'POST') {
    const body = await getJsonBody(req);
    patientsStore = filterLegacyDefaultPatients(patientsStore);

    let client = null;
    if (body.name && body.dob) {
      const name = String(body.name).toLowerCase().trim();
      const dob = String(body.dob).trim();
      client = patientsStore.find(c => c && String(c.name || '').toLowerCase().trim() === name && String(c.dob || '').trim() === dob);
    } else if (body.email && body.password) {
      const email = String(body.email).toLowerCase().trim();
      client = patientsStore.find(c => c && String(c.email || '').toLowerCase().trim() === email && String(c.password || '') === String(body.password));
    }

    if (client) {
      return sendJson(res, 200, { success: true, client: formatClientProfile(client) });
    } else {
      return sendJson(res, 400, { success: false, message: "Patient account not found. Please register." });
    }
  }

  // 5. RESTORE SESSION
  if (pathname === '/api/auth/restore-session' && method === 'POST') {
    const body = await getJsonBody(req);
    patientsStore = filterLegacyDefaultPatients(patientsStore);

    let client = null;
    if (body.id) {
      const idStr = String(body.id).trim();
      client = patientsStore.find(c => c && (String(c.id).trim() === idStr || toStableUUID(c.id) === toStableUUID(idStr)));
    }
    if (!client && body.name && body.dob) {
      const name = String(body.name).toLowerCase().trim();
      const dob = String(body.dob).trim();
      client = patientsStore.find(c => c && String(c.name || '').toLowerCase().trim() === name && String(c.dob || '').trim() === dob);
    }

    let itemsToSave = (body.items && Array.isArray(body.items)) ? body.items : [];

    if (client) {
      if ((!client.supplements || client.supplements.length === 0) && itemsToSave.length > 0) {
        client.supplements = itemsToSave.map(formatWebSupplement);
        client.status = "Protocol Active";
      }
      if (body.name) client.name = body.name;
      if (body.dob) client.dob = body.dob;
      if (body.email) client.email = body.email;
      if (body.goal) client.primaryGoal = body.goal;
      if (body.practitionerNote) client.guidanceNote = body.practitionerNote;

      saveLocalData();
      return sendJson(res, 200, {
        success: true,
        client: formatClientProfile(client),
        protocolItems: formatProtocolItems(client.supplements || [])
      });
    } else {
      const newId = body.id || ("cli_" + Date.now());
      const newClient = {
        id: newId,
        name: body.name || "Patient",
        dob: body.dob || "Not specified",
        email: body.email || `${(body.name || 'patient').toLowerCase().replace(/\s+/g, '.')}@wellnessclient.com`,
        password: "password123",
        status: itemsToSave.length > 0 ? "Protocol Active" : "Pending Intake",
        isNew: false,
        primaryGoal: body.goal || "Optimize peak vitality & performance",
        reportedSymptoms: body.symptoms || "None reported",
        currentSupplements: "None",
        guidanceNote: body.practitionerNote || "Waiting for your practitioner to prescribe your custom protocol.",
        practitionerName: "Luba Vitti",
        adherenceRate: 100,
        activeStreak: 0,
        dosesCompletedToday: 0,
        totalDosesToday: itemsToSave.length,
        supplements: itemsToSave.map(formatWebSupplement),
        adherenceLog: [
          { day: 'W', completed: false, date: '2026-07-29' },
          { day: 'T', completed: false, date: '2026-07-30' },
          { day: 'F', completed: false, date: '2026-07-31' },
          { day: 'S', completed: false, date: '2026-08-01' },
          { day: 'S', completed: false, date: '2026-08-02' },
          { day: 'M', completed: false, date: '2026-08-03' },
          { day: 'T', completed: false, date: '2026-08-04' }
        ],
        historyLogs: [],
        doctorMessages: [
          { id: "m-1", sender: "doctor", senderName: "Dr. Luba Vitti", text: `Welcome ${(body.name || 'Patient')}! Feel free to leave me a message here.`, timestamp: "Just now" }
        ]
      };

      patientsStore.unshift(newClient);
      saveLocalData();
      return sendJson(res, 200, {
        success: true,
        client: formatClientProfile(newClient),
        protocolItems: formatProtocolItems(newClient.supplements)
      });
    }
  }

  // 6. FETCH PROTOCOL BY CLIENT ID
  if (pathname.startsWith('/api/protocol/') && method === 'GET') {
    const clientId = pathname.replace('/api/protocol/', '').trim();
    const client = findPatient(clientId);

    if (client) {
      return sendJson(res, 200, {
        success: true,
        protocol: {
          title: "Male Wellness & Supplement Protocol",
          practitionerName: client.practitionerName || "Practitioner Luba Vitti",
          clientName: client.name,
          clientGoal: client.primaryGoal || "",
          practitionerNoteToClient: client.guidanceNote || "",
          pdfUrl: null,
          pdfName: null,
          items: formatProtocolItems(client.supplements || [])
        }
      });
    } else {
      return sendJson(res, 404, { success: false, message: "Protocol not found" });
    }
  }

  // 7. ASSIGN PROTOCOL ITEM
  if (pathname.startsWith('/api/practitioner/assign-protocol/') && method === 'POST') {
    const clientId = pathname.replace('/api/practitioner/assign-protocol/', '').trim();
    const body = await getJsonBody(req);
    const item = body.item || body;

    const client = findPatient(clientId);

    if (client) {
      if (!client.supplements) client.supplements = [];
      const newSupp = formatWebSupplement(item);

      const idx = client.supplements.findIndex(s => s && (s.id === newSupp.id || toStableUUID(s.id) === toStableUUID(newSupp.id) || String(s.name).toLowerCase() === String(newSupp.name).toLowerCase()));
      if (idx >= 0) {
        client.supplements[idx] = { ...client.supplements[idx], ...newSupp };
      } else {
        client.supplements.push(newSupp);
      }

      client.status = client.supplements.length > 0 ? "Protocol Active" : "Pending Intake";
      client.isNew = false;

      saveLocalData();
      return sendJson(res, 200, { success: true });
    } else {
      return sendJson(res, 404, { success: false, message: "Client not found" });
    }
  }

  // 8. DELETE PROTOCOL ITEM
  if (pathname.startsWith('/api/practitioner/delete-protocol-item/') && method === 'DELETE') {
    const parts = pathname.replace('/api/practitioner/delete-protocol-item/', '').split('/');
    const clientId = parts[0];
    const itemId = parts[1];

    const client = findPatient(clientId);

    if (client && client.supplements) {
      client.supplements = client.supplements.filter(s => s && s.id !== itemId && toStableUUID(s.id) !== toStableUUID(itemId));
      if (client.supplements.length === 0) {
        client.status = "Pending Intake";
      }
      saveLocalData();
      return sendJson(res, 200, { success: true });
    } else {
      return sendJson(res, 404, { success: false, message: "Item not found" });
    }
  }

  // 9. DELETE CLIENT
  if (pathname.startsWith('/api/practitioner/delete-client/') && method === 'DELETE') {
    const clientId = pathname.replace('/api/practitioner/delete-client/', '').trim();
    patientsStore = patientsStore.filter(c => c && c.id !== clientId && toStableUUID(c.id) !== toStableUUID(clientId) && String(c.name).toLowerCase().trim() !== clientId.toLowerCase().trim());

    saveLocalData();
    return sendJson(res, 200, { success: true });
  }

  // 10. POST DOSE LOG EVENT
  if (pathname === '/api/dose-log' && method === 'POST') {
    const body = await getJsonBody(req);
    const client = findPatient(body.clientId);

    if (client) {
      const isDone = body.status === 'completed' || body.status === 'Done';
      const newLog = {
        timestamp: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        action: `${isDone ? 'Took' : 'Snoozed'} ${body.itemName}`
      };
      if (!client.historyLogs) client.historyLogs = [];
      client.historyLogs.unshift(newLog);
      client.historyLogs = client.historyLogs.slice(0, 30);

      if (isDone && client.supplements) {
        const supp = client.supplements.find(s => s && (s.id === body.itemId || toStableUUID(s.id) === toStableUUID(body.itemId) || String(s.name).toLowerCase() === String(body.itemName).toLowerCase()));
        if (supp) {
          supp.completedToday = true;
          if (supp.totalServingsRemaining !== undefined && supp.totalServingsRemaining > 0) {
            supp.totalServingsRemaining -= 1;
          }
        }

        const completedCount = client.supplements.filter(s => s.completedToday).length;
        const totalCount = client.supplements.length;
        client.dosesCompletedToday = completedCount;
        client.totalDosesToday = totalCount;
        if (totalCount > 0 && completedCount === totalCount) {
          client.activeStreak = Math.max(client.activeStreak || 0, 1);
        }
        client.adherenceRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
      }

      saveLocalData();
      return sendJson(res, 200, { success: true });
    } else {
      return sendJson(res, 404, { success: false, message: "Client not found" });
    }
  }

  // 11. FETCH DOSE LOGS
  if (pathname.startsWith('/api/dose-log/') && method === 'GET') {
    const clientId = pathname.replace('/api/dose-log/', '').trim();
    const client = findPatient(clientId);

    if (client && client.historyLogs) {
      const doseLogs = client.historyLogs.map(l => ({
        id: "log_" + Date.now() + Math.random().toString(36).substr(2, 4),
        clientId: client.id,
        itemId: null,
        itemName: l.action.replace(/^(Took|Snoozed|Unchecked)\s+/, ''),
        timingSchedule: "Empty Stomach",
        status: l.action.startsWith("Took") ? "Done" : "Wait",
        timestamp: new Date().toISOString()
      }));
      return sendJson(res, 200, { success: true, doseLogs });
    } else {
      return sendJson(res, 200, { success: true, doseLogs: [] });
    }
  }

  // 12. FETCH CHAT MESSAGES
  if (pathname.startsWith('/api/chat/messages/') && method === 'GET') {
    const clientId = pathname.replace('/api/chat/messages/', '').trim();
    const client = findPatient(clientId);

    if (client) {
      const messages = (client.doctorMessages || []).map(m => ({
        id: m.id || ("m-" + Date.now()),
        clientId: client.id,
        sender: m.sender === 'doctor' ? 'doctor' : 'client',
        senderName: m.senderName || (m.sender === 'doctor' ? 'Dr. Luba Vitti' : client.name),
        text: m.text,
        timestamp: m.timestamp
      }));
      return sendJson(res, 200, { success: true, messages });
    } else {
      return sendJson(res, 200, { success: true, messages: [] });
    }
  }

  // 13. SEND CHAT MESSAGE
  if (pathname.startsWith('/api/chat/send/') && method === 'POST') {
    const clientId = pathname.replace('/api/chat/send/', '').trim();
    const body = await getJsonBody(req);
    const client = findPatient(clientId);

    if (client) {
      const newMsg = {
        id: "m-" + Date.now(),
        sender: body.sender || "client",
        senderName: body.senderName || (body.sender === 'doctor' ? 'Dr. Luba Vitti' : client.name),
        text: body.text,
        timestamp: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      };

      if (!client.doctorMessages) client.doctorMessages = [];
      client.doctorMessages.push(newMsg);

      saveLocalData();
      return sendJson(res, 200, { success: true, message: newMsg });
    } else {
      return sendJson(res, 404, { success: false, message: "Client not found" });
    }
  }

  // --- STATIC FILE SERVING FOR REACT FRONTEND ---
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = INDEX_HTML;
  }

  if (!fs.existsSync(filePath)) {
    filePath = INDEX_HTML;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`Error reading ${filePath}:`, err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`500 Server Error: ${err.message}`);
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`WellnessBuddy 2.0 Unified API & Web Server running on port ${PORT}`);
});
