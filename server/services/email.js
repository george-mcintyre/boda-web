const {
  BREVO_API_KEY,
  EMAIL_FROM_ADDRESS,
  EMAIL_FROM_NAME,
  COUPLE_NOTIFICATION_EMAILS,
} = require('../config/env');

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

function isConfigured() {
  return Boolean(BREVO_API_KEY);
}

function parseCoupleRecipients() {
  return (COUPLE_NOTIFICATION_EMAILS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(email => ({ email }));
}

async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!isConfigured()) {
    console.warn('[email] BREVO_API_KEY not set — skipping send to', Array.isArray(to) ? to.map(r => r.email).join(', ') : to);
    return { skipped: true };
  }
  const payload = {
    sender: { email: EMAIL_FROM_ADDRESS, name: EMAIL_FROM_NAME },
    to: Array.isArray(to) ? to : [to],
    subject,
    htmlContent: html,
    textContent: text,
  };
  if (replyTo) payload.replyTo = replyTo;

  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Brevo send failed: ${res.status} ${errBody}`);
  }
  return res.json().catch(() => ({}));
}

async function sendGiftConfirmationToBuyer({ guest, gift, giftChoice }) {
  if (!guest || !guest.email) {
    console.warn('[email] No guest email — cannot send buyer confirmation');
    return { skipped: true };
  }
  const lang = (guest.lang && ['en', 'es', 'fr', 'de'].includes(guest.lang)) ? guest.lang : 'en';
  const tpl = require('./emails/giftConfirmationBuyer')(lang, { guest, gift, giftChoice });
  return sendEmail({
    to: { email: guest.email, name: guest.name },
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    replyTo: { email: EMAIL_FROM_ADDRESS, name: EMAIL_FROM_NAME },
  });
}

async function sendGiftNotificationToCouple({ guest, gift, giftChoice }) {
  const recipients = parseCoupleRecipients();
  if (recipients.length === 0) {
    console.warn('[email] No COUPLE_NOTIFICATION_EMAILS configured — skipping couple notification');
    return { skipped: true };
  }
  const tpl = require('./emails/giftNotificationCouple')({ guest, gift, giftChoice });
  return sendEmail({
    to: recipients,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
}

module.exports = {
  isConfigured,
  sendEmail,
  sendGiftConfirmationToBuyer,
  sendGiftNotificationToCouple,
};
