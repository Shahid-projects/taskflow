const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/signup',
  [body('name').trim().isLength({ min: 2, max: 100 }),
   body('email').isEmail().normalizeEmail(),
   body('password').isLength({ min: 6 })],
  ctrl.signup);

router.post('/login',
  [body('email').isEmail().normalizeEmail(),
   body('password').notEmpty()],
  ctrl.login);

router.get('/me',       authenticate, ctrl.me);
router.get('/users',    authenticate, requireAdmin, ctrl.listUsers);

module.exports = router;
