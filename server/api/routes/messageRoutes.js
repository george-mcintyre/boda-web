const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const messageCtrl = require('../../controllers/messageController');

// Public list of messages (using guest endpoint for backwards compatibility)
router.get('/messages', messageCtrl.listGuestMessages);

// Guests can create messages
router.post('/messages', auth('guest'), messageCtrl.createGuestMessage);

// Guests can toggle a reaction on a message
router.post('/messages/:id/reaction', auth('guest'), messageCtrl.reactGuest);

// Admins can delete any message
router.delete('/messages/:id', auth('admin'), messageCtrl.deleteAdminMessage);

module.exports = router;
