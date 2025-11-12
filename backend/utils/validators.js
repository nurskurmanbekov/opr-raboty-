const { body } = require('express-validator');

exports.registerValidation = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['superadmin', 'district_admin', 'officer', 'observer']).withMessage('Invalid role')
];

exports.loginValidation = [
  body('email').notEmpty().withMessage('Email or ID number is required'),
  body('password').notEmpty().withMessage('Password is required')
];

exports.createClientValidation = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('idNumber').notEmpty().withMessage('ID number is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  // Поддержка обоих полей: старого district (STRING) и нового districtId (UUID)
  body('district').optional().isString().withMessage('District must be a string'),
  body('districtId').optional().isUUID().withMessage('District ID must be a valid UUID'),
  body('assignedHours').isInt({ min: 1 }).withMessage('Assigned hours must be positive'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];