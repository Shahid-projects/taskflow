const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/projectController');
const { authenticate, requireProjectMember, requireProjectAdmin } = require('../middleware/auth');

const nameVal = body('name').trim().isLength({ min: 2, max: 150 });

// All project routes require auth
router.use(authenticate);

router.get('/',    ctrl.list);
router.post('/',   [nameVal], ctrl.create);
router.get('/:id', requireProjectMember, ctrl.get);
router.put('/:id', requireProjectAdmin,  [nameVal], ctrl.update);
router.delete('/:id', requireProjectAdmin, ctrl.remove);

// Members
router.post('/:id/members',          requireProjectAdmin, ctrl.addMember);
router.delete('/:id/members/:userId', requireProjectAdmin, ctrl.removeMember);

module.exports = router;
