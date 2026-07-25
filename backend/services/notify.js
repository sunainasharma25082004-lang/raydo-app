const axios = require('axios');

function envKey(name) {
  const v = process.env[name];
  if (!v) return null;
  return String(v).trim().replace(/^["']|["']$/g, '');
}

function normalizePhoneIN(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length > 10) return digits;
  return null;
}

/**
 * Build rider WhatsApp message when driver accepts.
 */
function buildDriverComingMessage({
  driverName,
  vehicleType,
  vehicleReg,
  etaMinutes,
  distanceKm,
  otp,
}) {
  const eta =
    etaMinutes != null ? `about ${etaMinutes} minute${etaMinutes === 1 ? '' : 's'}` : 'a few minutes';
  const dist =
    distanceKm != null ? ` (~${distanceKm} km away)` : '';
  const veh = [vehicleType, vehicleReg].filter(Boolean).join(' · ') || 'vehicle';
  const otpLine = otp ? `\nTrip OTP: ${otp}` : '';
  return (
    `Raydo 🚗\n` +
    `Driver *${driverName || 'Partner'}* is on the way to your pickup.\n` +
    `Vehicle: ${veh}${dist}\n` +
    `Estimated arrival: *${eta}*.\n` +
    `You can chat with your driver in the Raydo app until pickup.` +
    otpLine
  );
}

async function sendWhatsAppMeta({ toE164, text }) {
  const token = envKey('WHATSAPP_TOKEN') || envKey('META_WHATSAPP_TOKEN');
  const phoneId = envKey('WHATSAPP_PHONE_NUMBER_ID') || envKey('META_PHONE_NUMBER_ID');
  if (!token || !phoneId) return null;

  const res = await axios.post(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: toE164,
      type: 'text',
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 12000,
    },
  );
  return { channel: 'whatsapp_meta', id: res.data?.messages?.[0]?.id || true };
}

async function sendWhatsAppTwilio({ toE164, text }) {
  const sid = envKey('TWILIO_ACCOUNT_SID');
  const token = envKey('TWILIO_AUTH_TOKEN');
  const from = envKey('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886';
  if (!sid || !token) return null;

  const params = new URLSearchParams();
  params.set('From', from.startsWith('whatsapp:') ? from : `whatsapp:${from}`);
  params.set('To', `whatsapp:+${toE164}`);
  params.set('Body', text);

  const res = await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    params.toString(),
    {
      auth: { username: sid, password: token },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 12000,
    },
  );
  return { channel: 'whatsapp_twilio', id: res.data?.sid || true };
}

async function sendWhatsAppCallMeBot({ toE164, text }) {
  const apikey = envKey('CALLMEBOT_API_KEY');
  if (!apikey) return null;
  const res = await axios.get('https://api.callmebot.com/whatsapp.php', {
    params: { phone: toE164, text, apikey },
    timeout: 12000,
  });
  return { channel: 'whatsapp_callmebot', id: String(res.data || true) };
}

async function sendSmsFast2SMS({ toE164, text }) {
  const key = envKey('FAST2SMS_API_KEY');
  if (!key || key.includes('your_')) return null;
  const numbers = toE164.startsWith('91') ? toE164.slice(2) : toE164;
  const res = await axios.post(
    'https://www.fast2sms.com/dev/bulkV2',
    {
      route: 'q',
      message: String(text).slice(0, 250),
      numbers,
    },
    {
      headers: {
        authorization: key,
        'Content-Type': 'application/json',
      },
      timeout: 12000,
    },
  );
  return { channel: 'sms_fast2sms', id: res.data?.request_id || true };
}

/**
 * Notify rider that driver is coming (WhatsApp preferred, SMS fallback).
 * Always returns a result object; never throws to the accept flow.
 */
async function notifyRiderDriverComing({
  phone,
  driverName,
  vehicleType,
  vehicleReg,
  etaMinutes,
  distanceKm,
  otp,
}) {
  const toE164 = normalizePhoneIN(phone);
  const text = buildDriverComingMessage({
    driverName,
    vehicleType,
    vehicleReg,
    etaMinutes,
    distanceKm,
    otp,
  });

  if (!toE164) {
    console.log('[Notify] No rider phone — WhatsApp skipped. Message:\n', text);
    return {
      sent: false,
      channel: 'none',
      reason: 'missing_phone',
      message: text,
      waMeLink: null,
    };
  }

  const waMeLink = `https://wa.me/${toE164}?text=${encodeURIComponent(text)}`;

  const attempts = [
    () => sendWhatsAppMeta({ toE164, text }),
    () => sendWhatsAppTwilio({ toE164, text }),
    () => sendWhatsAppCallMeBot({ toE164, text }),
    () => sendSmsFast2SMS({ toE164, text }),
  ];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result) {
        console.log(`[Notify] Sent via ${result.channel} to +${toE164}`);
        return {
          sent: true,
          channel: result.channel,
          id: result.id,
          message: text,
          waMeLink,
          to: `+${toE164}`,
        };
      }
    } catch (err) {
      console.warn('[Notify] provider failed:', err.response?.data || err.message);
    }
  }

  console.log(
    '[Notify] No WhatsApp/SMS provider configured. Set WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID, or TWILIO_*, or CALLMEBOT_API_KEY.\n',
    text,
  );
  return {
    sent: false,
    channel: 'log_only',
    reason: 'no_provider',
    message: text,
    waMeLink,
    to: `+${toE164}`,
  };
}

/**
 * Send Driver ID + password to partner's registered mobile after KYC approve.
 */
function buildDriverCredentialsMessage({ name, loginId, password, phone }) {
  return (
    `Raydo Partner ✅\n` +
    `Hello ${name || 'Partner'}, your KYC is approved.\n\n` +
    `Driver ID: ${loginId}\n` +
    `Password: ${password}\n\n` +
    `Open Raydo Driver app → Login with ID & password.\n` +
    `Keep this message safe. Do not share your password.\n` +
    (phone ? `Registered mobile: +91 ${String(phone).replace(/\D/g, '').slice(-10)}` : '')
  );
}

async function notifyDriverCredentials({ phone, name, loginId, password }) {
  const toE164 = normalizePhoneIN(phone);
  const text = buildDriverCredentialsMessage({ name, loginId, password, phone });
  // Short SMS (route q has length limits)
  const smsText = `Raydo KYC OK. ID:${loginId} Pass:${password}. Login Raydo Driver app. Keep safe.`;

  if (!toE164) {
    console.log('[Notify] No driver phone — credentials SMS skipped:\n', text);
    return {
      sent: false,
      channel: 'none',
      reason: 'missing_phone',
      message: text,
      waMeLink: null,
    };
  }

  const waMeLink = `https://wa.me/${toE164}?text=${encodeURIComponent(text)}`;

  const attempts = [
    () => sendWhatsAppMeta({ toE164, text }),
    () => sendWhatsAppTwilio({ toE164, text }),
    () => sendWhatsAppCallMeBot({ toE164, text }),
    () => sendSmsFast2SMS({ toE164, text: smsText }),
  ];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result) {
        console.log(`[Notify] Driver credentials via ${result.channel} → +${toE164}`);
        return {
          sent: true,
          channel: result.channel,
          id: result.id,
          message: text,
          waMeLink,
          to: `+${toE164}`,
        };
      }
    } catch (err) {
      console.warn('[Notify] credentials provider failed:', err.response?.data || err.message);
    }
  }

  console.log(
    '[Notify] Credentials message (no SMS/WhatsApp provider). Admin still has login details.\n',
    text,
  );
  return {
    sent: false,
    channel: 'log_only',
    reason: 'no_provider',
    message: text,
    waMeLink,
    to: `+${toE164}`,
  };
}

module.exports = {
  notifyRiderDriverComing,
  notifyDriverCredentials,
  buildDriverComingMessage,
  buildDriverCredentialsMessage,
  normalizePhoneIN,
};
