const ANONYMOUS_GUEST_EMAIL = 'invitado@boda.com';

function isAnonymousGuestEmail(email) {
  return typeof email === 'string'
    && email.trim().toLowerCase() === ANONYMOUS_GUEST_EMAIL;
}

module.exports = { ANONYMOUS_GUEST_EMAIL, isAnonymousGuestEmail };
