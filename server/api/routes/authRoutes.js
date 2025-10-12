const router = require('express').Router();
const { postLogin } = require('../../auth/controller');
router.post('/login', postLogin);
module.exports = router;
