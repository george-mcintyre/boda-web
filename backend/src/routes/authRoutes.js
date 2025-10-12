const router = require('express').Router();
const { postLogin } = require('../controllers/authController');
router.post('/login', postLogin);
module.exports = router;
