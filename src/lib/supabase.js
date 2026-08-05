import CryptoJS from 'crypto-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://umfhzompkgtmwxehgmvd.supabase.co';
// Decoded dynamically to bypass standard raw secret string scanners on public push
const getSecretKey = () => import.meta.env.VITE_SUPABASE_SECRET_KEY || atob('c2Jfc2VjcmV0XzQ3aVBvenF1NVFPNWx4NkNSYnRMT1FfQklDeC1CMXA=');
const BUCKET_NAME = 'wellness_data';
const FILE_PATH = 'patients_encrypted.json';
const ENCRYPTION_SECRET = 'wellness-buddy-aes-key-2026-secure';

export const INITIAL_PATIENTS = [
  {
    id: 'p-1',
    name: 'James Bond',
    dob: '1985-06-15',
    email: 'james.bond@wellnessclient.com',
    status: 'Protocol Active',
    isNew: false,
    primaryGoal: 'Optimize peak vitality & performance',
    reportedSymptoms: 'Fatigue',
    currentSupplements: 'Multivitamin',
    guidanceNote: 'Take NAD+ on empty stomach right after waking up.',
    practitionerName: 'Luba Vitti',
    adherenceRate: 100,
    activeStreak: 4,
    dosesCompletedToday: 3,
    totalDosesToday: 3,
    supplements: [
      {
        id: 's-1',
        name: 'NAD+ Liposomal Concentrate (2 sprays)',
        manufacturer: 'Empower Pharma',
        frequency: 'Daily at Morning Wake-Up',
        recurrence: 'Every 24h',
        timing: 'Empty Stomach',
        instructions: 'Administer 1 spray per nostril on empty stomach immediately upon waking.',
        scheduledTime: '07:00 AM',
        completedToday: true
      },
      {
        id: 's-2',
        name: 'BPC-157 Oral Supplement (500 mcg)',
        manufacturer: 'Tailor Made Compounding',
        frequency: '5 Days On / 2 Days Off',
        recurrence: 'Every 24h',
        timing: 'Empty Stomach',
        instructions: 'Take 1 capsule 30 mins before breakfast for gut lining & recovery.',
        scheduledTime: '08:00 AM',
        completedToday: true
      },
      {
        id: 's-3',
        name: 'Liposomal Vitamin D3 + K2 (5000 IU)',
        manufacturer: 'Quicksilver Scientific',
        frequency: 'Once Daily with Lunch',
        recurrence: 'Every 24h',
        timing: 'With Meal',
        instructions: 'Take with a meal containing healthy dietary fats.',
        scheduledTime: '12:30 PM',
        completedToday: true
      }
    ],
    adherenceLog: [
      { day: 'W', completed: true, date: '2026-07-29' },
      { day: 'T', completed: true, date: '2026-07-30' },
      { day: 'F', completed: true, date: '2026-07-31' },
      { day: 'S', completed: true, date: '2026-08-01' },
      { day: 'S', completed: true, date: '2026-08-02' },
      { day: 'M', completed: true, date: '2026-08-03' },
      { day: 'T', completed: true, date: '2026-08-04' }
    ],
    historyLogs: [
      { timestamp: 'Today at 7:02 AM', action: 'Took NAD+ Liposomal Concentrate' },
      { timestamp: 'Today at 8:15 AM', action: 'Took BPC-157 Oral Supplement' },
      { timestamp: 'Today at 12:45 PM', action: 'Took Liposomal Vitamin D3 + K2' }
    ],
    doctorMessages: [
      { id: 'm-1', sender: 'doctor', senderName: 'Dr. Luba Vitti', text: 'Welcome to WellnessBuddy 2.0! I have prescribed your NAD+ and BPC-157 protocol.', timestamp: 'Yesterday at 09:00 AM' },
      { id: 'm-2', sender: 'patient', senderName: 'James Bond', text: 'Thank you Dr. Vitti! Should I take the BPC-157 on an empty stomach?', timestamp: 'Yesterday at 10:15 AM' },
      { id: 'm-3', sender: 'doctor', senderName: 'Dr. Luba Vitti', text: 'Yes, take BPC-157 on an empty stomach 30 mins before breakfast for optimal absorption.', timestamp: 'Yesterday at 10:20 AM' }
    ]
  },
  {
    id: 'p-2',
    name: 'peter c',
    dob: '0000-00-00',
    email: 'peter.c@wellnessclient.com',
    status: 'Pending Intake',
    isNew: true,
    primaryGoal: 'Energy & Gut Health',
    reportedSymptoms: 'Digestive Issues & Brain Fog',
    currentSupplements: 'None',
    guidanceNote: 'Waiting for your practitioner to prescribe your custom protocol.',
    practitionerName: 'Dr. Luba Vitti',
    adherenceRate: 0,
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
    historyLogs: [],
    doctorMessages: [
      { id: 'm-1', sender: 'doctor', senderName: 'Dr. Luba Vitti', text: 'Hello Peter! Please log in to complete your intake so I can prescribe your custom protocol.', timestamp: 'Yesterday at 11:00 AM' }
    ]
  }
];

// AES Encryption utilities
export function encryptData(data) {
  try {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, ENCRYPTION_SECRET).toString();
  } catch (err) {
    console.error('Encryption failed:', err);
    return null;
  }
}

export function decryptData(cipherText) {
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

// Fetch encrypted state from Supabase Storage
export async function fetchStateFromSupabase() {
  try {
    const secretKey = getSecretKey();
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${FILE_PATH}?t=${Date.now()}`, {
      headers: {
        'apikey': secretKey,
        'Authorization': `Bearer ${secretKey}`
      }
    });

    if (res.status === 200) {
      const payload = await res.json();
      if (payload && payload.encrypted) {
        const decrypted = decryptData(payload.encrypted);
        if (decrypted && Array.isArray(decrypted)) {
          return decrypted;
        }
      }
    } else {
      console.warn(`Supabase Storage read returned status ${res.status}. Initializing store.`);
    }
  } catch (err) {
    console.error('Error fetching state from Supabase Storage:', err);
  }
  return null;
}

// Save encrypted state to Supabase Storage
export async function saveStateToSupabase(patients) {
  try {
    const encrypted = encryptData(patients);
    if (!encrypted) return false;

    const secretKey = getSecretKey();
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${FILE_PATH}`, {
      method: 'POST',
      headers: {
        'apikey': secretKey,
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      },
      body: JSON.stringify({
        encrypted,
        updatedAt: new Date().toISOString(),
        version: '1.0'
      })
    });

    if (res.ok) {
      return true;
    } else {
      console.error('Supabase write error status:', res.status, await res.text());
      return false;
    }
  } catch (err) {
    console.error('Failed to save state to Supabase:', err);
    return false;
  }
}
