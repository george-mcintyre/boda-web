const { localize } = require('../../utils/localized');

function getGuestFirstName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().split(/\s+/)[0];
}

function getGiftTypeLabel(type, lang) {
  const map = {
    en: { cash: 'Honeymoon card', cube: 'Sculpture block', figurine: 'Figurine' },
    es: { cash: 'Tarjeta de luna de miel', cube: 'Bloque de la escultura', figurine: 'Figurita' },
    fr: { cash: 'Carte lune de miel', cube: 'Bloc de la sculpture', figurine: 'Figurine' },
    de: { cash: 'Hochzeitsreise-Karte', cube: 'Skulpturblock', figurine: 'Figur' },
  };
  return (map[lang] || map.en)[type] || (map[lang] || map.en).cash;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STYLES = `
  body { margin:0; padding:0; background:#f6eeec; font-family: Georgia, "Times New Roman", serif; color:#2c1810; }
  .wrap { max-width:560px; margin:0 auto; padding:24px 16px; }
  .card { background:#ffffff; border-radius:12px; box-shadow:0 8px 24px rgba(44,24,16,0.10); overflow:hidden; }
  .header { background:linear-gradient(135deg, #8b5a96 0%, #4a2c5a 100%); color:#ffffff; padding:28px 24px; text-align:center; }
  .header h1 { margin:0; font-family:'Playfair Display', Georgia, serif; font-size:22px; line-height:1.3; color:#ffffff; }
  .body { padding:24px 28px; line-height:1.55; font-size:15px; }
  .body p { margin:0 0 14px; }
  .summary { background:#fbf6ef; border:1px solid rgba(139,90,150,0.18); border-radius:8px; padding:16px 18px; margin:18px 0; }
  .summary-row { display:block; margin:4px 0; }
  .summary-label { font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#8b5a96; font-weight:700; }
  .summary-value { font-size:16px; color:#2c1810; }
  .amount { display:inline-block; background:#ffffff; border:1px solid rgba(139,90,150,0.3); border-radius:999px; padding:4px 12px; color:#5b4337; font-weight:700; font-size:15px; margin-top:4px; }
  .message-block { background:rgba(139,90,150,0.06); border:1px dashed rgba(139,90,150,0.32); border-radius:10px; padding:12px 14px; font-style:italic; color:#5b4337; margin-top:8px; }
  .signoff { font-family:'Playfair Display', Georgia, serif; font-style:italic; color:#5b4337; margin-top:24px; }
  .footer { padding:14px 24px 24px; text-align:center; color:#8a7568; font-size:12px; }
`;

function buildHtml({ greeting, intro, summary, dayLine, signoff }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(summary.headline)}</title>
<style>${STYLES}</style>
</head><body>
<div class="wrap">
  <div class="card">
    <div class="header"><h1>${escapeHtml(summary.headline)}</h1></div>
    <div class="body">
      <p>${escapeHtml(greeting)}</p>
      <p>${escapeHtml(intro)}</p>
      <div class="summary">
        <div class="summary-row"><span class="summary-label">${escapeHtml(summary.typeLabel)}</span></div>
        <div class="summary-row"><span class="summary-value">${escapeHtml(summary.giftType)} — ${escapeHtml(summary.giftTitle)}</span></div>
        <div class="summary-row"><span class="amount">€${escapeHtml(summary.amount)}</span></div>
        ${summary.message ? `
          <div class="summary-row" style="margin-top:14px;"><span class="summary-label">${escapeHtml(summary.messageLabel)}</span></div>
          <div class="message-block">“${escapeHtml(summary.message)}”${summary.signer ? ` — ${escapeHtml(summary.signer)}` : ''}</div>
        ` : ''}
      </div>
      <p>${escapeHtml(dayLine)}</p>
      <p class="signoff">${escapeHtml(signoff)}</p>
    </div>
    <div class="footer">Iluminada &amp; George · June 6, 2026 · Marbella, Spain</div>
  </div>
</div>
</body></html>`;
}

function buildText({ greeting, intro, summary, dayLine, signoff }) {
  return [
    summary.headline,
    '',
    greeting,
    '',
    intro,
    '',
    `${summary.typeLabel}: ${summary.giftType} — ${summary.giftTitle}`,
    `€${summary.amount}`,
    summary.message ? `\n${summary.messageLabel}: "${summary.message}"${summary.signer ? ' — ' + summary.signer : ''}\n` : '',
    dayLine,
    '',
    signoff,
    '',
    '— Iluminada & George · June 6, 2026 · Marbella, Spain',
  ].join('\n');
}

module.exports = function buildGiftConfirmationBuyer(lang, { guest, gift, giftChoice }) {
  const firstName = getGuestFirstName(guest && guest.name);
  const giftType = gift && gift.type ? gift.type : 'cash';
  const typeLabel = getGiftTypeLabel(giftType, lang);
  const giftTitle = localize(gift && gift.title, lang);
  const amount = String(giftChoice && giftChoice.amount != null ? giftChoice.amount : '');
  const message = (giftChoice && giftChoice.message) || '';
  const signer = (giftChoice && giftChoice.giftFrom) || '';

  let content;
  switch (lang) {
    case 'es':
      content = {
        greeting: `Hola ${firstName || ''},`.trim(),
        intro: 'Acabamos de recibir tu regalo de boda — ¡muchísimas gracias! Aquí tienes una confirmación con los detalles.',
        summary: {
          headline: '¡Gracias por tu regalo de boda!',
          typeLabel: 'Tu regalo',
          messageLabel: 'Tu mensaje',
          giftType: typeLabel,
          giftTitle, amount, message, signer,
        },
        dayLine: 'El día de la boda te lo entregaremos en tu mesa junto con una nota de regalo que ya habremos impreso con tu mensaje, lista para que la firmes y la entregues con tu regalo.',
        signoff: 'Con cariño, Iluminada & George',
      };
      break;
    case 'fr':
      content = {
        greeting: `Bonjour ${firstName || ''},`.trim(),
        intro: 'Nous venons de recevoir votre cadeau de mariage — un immense merci ! Voici une confirmation avec les détails.',
        summary: {
          headline: 'Merci pour votre cadeau de mariage !',
          typeLabel: 'Votre cadeau',
          messageLabel: 'Votre message',
          giftType: typeLabel,
          giftTitle, amount, message, signer,
        },
        dayLine: 'Le jour du mariage, nous vous le remettrons à votre table avec un mot d’accompagnement que nous aurons déjà imprimé avec votre message, prêt à être signé et offert avec votre cadeau.',
        signoff: 'Avec toute notre affection, Iluminada & George',
      };
      break;
    case 'de':
      content = {
        greeting: `Hallo ${firstName || ''},`.trim(),
        intro: 'Wir haben gerade dein Hochzeitsgeschenk erhalten — vielen herzlichen Dank! Hier ist eine Bestätigung mit den Details.',
        summary: {
          headline: 'Danke für dein Hochzeitsgeschenk!',
          typeLabel: 'Dein Geschenk',
          messageLabel: 'Deine Nachricht',
          giftType: typeLabel,
          giftTitle, amount, message, signer,
        },
        dayLine: 'Am Hochzeitstag bringen wir es zu deinem Tisch zusammen mit einer Geschenkkarte, die wir bereits mit deiner Nachricht bedruckt haben, bereit zum Unterschreiben und zur Übergabe mit deinem Geschenk.',
        signoff: 'Mit Liebe, Iluminada & George',
      };
      break;
    case 'en':
    default:
      content = {
        greeting: `Hi ${firstName || ''},`.trim(),
        intro: 'We’ve just received your wedding gift — thank you so much! Here’s a confirmation with the details.',
        summary: {
          headline: 'Thank you for your wedding gift!',
          typeLabel: 'Your gift',
          messageLabel: 'Your message',
          giftType: typeLabel,
          giftTitle, amount, message, signer,
        },
        dayLine: 'On the wedding day we’ll deliver it to your table together with a personal gift note we’ve already printed with your message, ready for you to sign and hand to us with your gift.',
        signoff: 'With love, Iluminada & George',
      };
  }

  return {
    subject: content.summary.headline,
    html: buildHtml(content),
    text: buildText(content),
  };
};
