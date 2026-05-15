const { localize } = require('../../utils/localized');

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = function buildGiftNotificationCouple({ guest, gift, giftChoice }) {
  const guestName = (guest && guest.name) || '(unknown guest)';
  const guestEmail = (guest && guest.email) || '';
  const guestLang = (guest && guest.lang) || 'en';
  const giftType = gift && gift.type ? gift.type : 'cash';
  const giftTitle = localize(gift && gift.title, 'en') || '(no title)';
  const amount = giftChoice && giftChoice.amount != null ? `€${giftChoice.amount}` : '(no amount)';
  const message = (giftChoice && giftChoice.message) || '';
  const signer = (giftChoice && giftChoice.giftFrom) || '';
  const purchasedAt = giftChoice && giftChoice.date ? new Date(giftChoice.date).toISOString() : new Date().toISOString();
  const sessionId = (giftChoice && giftChoice.stripeSessionId) || '';

  const subject = `New gift purchase: ${giftTitle} (${amount})`;

  const lines = [
    `Type: ${giftType}`,
    `Title: ${giftTitle}`,
    `Amount: ${amount}`,
    `Buyer: ${guestName} <${guestEmail}> [lang=${guestLang}]`,
    `Signer (printed on note): ${signer || '(default — uses party names)'}`,
    `Message: ${message || '(none)'}`,
    `Purchased at: ${purchasedAt}`,
    `Stripe session: ${sessionId || '(n/a)'}`,
  ];
  const text = lines.join('\n');

  const html = `<!doctype html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#222; padding:16px;">
    <h2 style="margin:0 0 12px; font-size:18px;">${escapeHtml(subject)}</h2>
    <table style="border-collapse:collapse; font-size:14px;">
      ${lines.map(l => {
        const [label, ...rest] = l.split(': ');
        const value = rest.join(': ');
        return `<tr><td style="padding:4px 12px 4px 0; color:#666; vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 0;"><strong>${escapeHtml(value)}</strong></td></tr>`;
      }).join('')}
    </table>
  </body></html>`;

  return { subject, html, text };
};
