const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/taskController');
const { authenticate, requireProjectMember } = require('../middleware/auth');

router.use(authenticate);

// Tasks scoped to a project (mounted under /api/projects/:projectId/tasks in app.js)
router.get('/',    requireProjectMember, ctrl.listByProject);
router.post('/',   requireProjectMember,
  [body('title').trim().isLength({ min: 2, max: 200 })],
  ctrl.create);

// Standalone task routes  (mounted at /api/tasks)
// These are added separately in app.js
module.exports = router;

// Separate standalone router
const standaloneRouter = require('express').Router();
standaloneRouter.use(authenticate);
standaloneRouter.get('/my',          ctrl.myTasks);
standaloneRouter.get('/:id',         ctrl.get);
standaloneRouter.put('/:id',         ctrl.update);
standaloneRouter.patch('/:id/status', ctrl.updateStatus);
standaloneRouter.delete('/:id',      ctrl.remove);
standaloneRouter.post('/:id/comments', ctrl.addComment);

module.exports.standalone = standaloneRouter;
