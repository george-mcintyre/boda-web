const router = require('express').Router();
const adminExpCtrl = require('../../controllers/adminExpansionController');

// Public routes (no authentication required)
router.use('/api', require('./authRoutes'));

router.get('/api/venue-print-seating', adminExpCtrl.getVenuePrintSeating);

// Namespace-based API routes
router.use('/api/guest', require('./guestApi'));
router.use('/api/admin', require('./adminApi'));

// Legacy routes (to be deprecated) - keeping for backwards compatibility during migration
router.use('/api', require('./guestRoutes'));
router.use('/api', require('./messageRoutes'));
router.use('/', require('./adminRoutes'));

module.exports = router;
