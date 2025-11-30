const router = require('express').Router();

// Public routes (no authentication required)
router.use('/api', require('./authRoutes'));

// Namespace-based API routes
router.use('/api/guest', require('./guestApi'));
router.use('/api/admin', require('./adminApi'));

// Legacy routes (to be deprecated) - keeping for backwards compatibility during migration
router.use('/api', require('./guestRoutes'));
router.use('/api', require('./messageRoutes'));
router.use('/', require('./adminRoutes'));

module.exports = router;
