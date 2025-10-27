const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const messageCtrl = require('../../controllers/messageController');

// Public list of messages
router.get('/messages', messageCtrl.list);

// Guests can create messages
router.post('/messages', auth('guest'), messageCtrl.create);

// Guests can toggle a reaction on a message
router.post('/messages/:id/reaction', auth('guest'), messageCtrl.react);

// Admins can delete any message
router.delete('/messages/:id', auth('admin'), messageCtrl.remove);

module.exports = router;
