const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const guestCtrl = require('../../controllers/guestController');
const messageCtrl = require('../../controllers/messageController');
const menuCtrl = require('../../controllers/menuController');

// Guests
router.get('/api/admin/guests', auth('admin'), guestCtrl.list);
router.post('/api/admin/guests', auth('admin'), guestCtrl.create);
router.put('/api/admin/guests/:id', auth('admin'), guestCtrl.update);
router.delete('/api/admin/guests/:id', auth('admin'), guestCtrl.remove);

// Messages
router.get('/api/admin/messages', auth('admin'), messageCtrl.listAdminMessages);
router.delete('/api/admin/messages/:id', auth('admin'), messageCtrl.deleteAdminMessage);

// Course Data
router.get('/api/admin/courseData', auth('admin'), menuCtrl.listCourses);
router.post('/api/admin/courseData', auth('admin'), menuCtrl.createCourse);
router.put('/api/admin/courseData/:id', auth('admin'), menuCtrl.updateCourse);
router.delete('/api/admin/courseData/:id', auth('admin'), menuCtrl.deleteCourse);

// Course Options
router.get('/api/admin/courseData/:courseId/options', auth('admin'), menuCtrl.listCourseOptions);
router.post('/api/admin/courseData/:courseId/options', auth('admin'), menuCtrl.createCourseOption);
router.put('/api/admin/courseData/:courseId/options/:id', auth('admin'), menuCtrl.updateCourseOption);
router.delete('/api/admin/courseData/:courseId/options/:id', auth('admin'), menuCtrl.deleteCourseOption);
module.exports = router;
