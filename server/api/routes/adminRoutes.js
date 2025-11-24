const router = require('express').Router();
const { auth } = require('../../auth/middleware');
const guestCtrl = require('../../controllers/guestController');
const messageCtrl = require('../../controllers/messageController');
const menuCtrl = require('../../controllers/menuController');
const adminCtrl = require('../../controllers/adminController');
const multer = require('multer');

// Configure multer for menu option image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp_uploads/'); // Temporary upload directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

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
router.get('/api/admin/courseData/:courseId/options/:optionId', auth('admin'), menuCtrl.getCourseOptionById);
router.post('/api/admin/courseData/:courseId/options', auth('admin'), menuCtrl.createCourseOption);
router.put('/api/admin/courseData/:courseId/options/:optionId', auth('admin'), menuCtrl.updateCourseOption);
router.delete('/api/admin/courseData/:courseId/options/:optionId', auth('admin'), menuCtrl.deleteCourseOption);

// Menu Option Images
router.post('/api/admin/menu-options/upload-image', auth('admin'), upload.single('image'), adminCtrl.uploadMenuOptionImage);
module.exports = router;
