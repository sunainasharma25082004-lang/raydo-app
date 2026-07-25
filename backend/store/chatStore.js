const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');

/** Chat allowed only while driver is coming / waiting at pickup */
const CHAT_OPEN_STATUSES = new Set(['Accepted', 'Arrived']);

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CHATS_FILE)) fs.writeFileSync(CHATS_FILE, '{}');
}

function readAll() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8')) || {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  ensure();
  fs.writeFileSync(CHATS_FILE, JSON.stringify(data, null, 2));
}

function isChatOpen(rideStatus) {
  return CHAT_OPEN_STATUSES.has(String(rideStatus || ''));
}

function getMessages(rideId) {
  if (!rideId) return [];
  const all = readAll();
  return Array.isArray(all[rideId]) ? all[rideId] : [];
}

/**
 * @param {{ rideId: string, senderRole: 'rider'|'driver', senderId: string, text: string, rideStatus: string }}
 */
function addMessage({ rideId, senderRole, senderId, text, rideStatus }) {
  if (!rideId) {
    const err = new Error('rideId required');
    err.status = 400;
    throw err;
  }
  if (!isChatOpen(rideStatus)) {
    const err = new Error(
      rideStatus === 'In_Progress' || rideStatus === 'Completed'
        ? 'Chat closed after pickup. Messaging is only allowed before the trip starts.'
        : 'Chat is not available for this ride right now.',
    );
    err.status = 403;
    throw err;
  }
  const body = String(text || '').trim();
  if (!body) {
    const err = new Error('Message text required');
    err.status = 400;
    throw err;
  }
  if (body.length > 1000) {
    const err = new Error('Message too long (max 1000 chars)');
    err.status = 400;
    throw err;
  }
  if (senderRole !== 'rider' && senderRole !== 'driver') {
    const err = new Error('senderRole must be rider or driver');
    err.status = 400;
    throw err;
  }

  const msg = {
    id: crypto.randomBytes(8).toString('hex'),
    rideId,
    senderRole,
    senderId: senderId || '',
    text: body,
    createdAt: new Date().toISOString(),
  };

  const all = readAll();
  if (!Array.isArray(all[rideId])) all[rideId] = [];
  all[rideId].push(msg);
  // keep last 200 messages per ride
  if (all[rideId].length > 200) all[rideId] = all[rideId].slice(-200);
  writeAll(all);
  return msg;
}

function clearChat(rideId) {
  if (!rideId) return;
  const all = readAll();
  if (all[rideId]) {
    delete all[rideId];
    writeAll(all);
  }
}

module.exports = {
  ensure,
  isChatOpen,
  getMessages,
  addMessage,
  clearChat,
  CHAT_OPEN_STATUSES,
};
