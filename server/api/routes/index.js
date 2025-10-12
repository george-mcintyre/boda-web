const router = require('express').Router();

router.use('/api', require('./authRoutes'));
router.use('/api', require('./guestRoutes'));
router.use('/api', require('./eventRoutes'));

module.exports = router;
