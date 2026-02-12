const { body, validationResult } = require('express-validator');

const validateOCRUpload = [
    body('sourceType')
        .optional()
        .isIn(['image', 'camera', 'pdf'])
        .withMessage('Invalid source type'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

const validateTTSRequest = [
    body('text')
        .notEmpty()
        .withMessage('Text is required')
        .isLength({ max: 5000 })
        .withMessage('Text too long (max 5000 characters)'),

    body('language')
        .notEmpty()
        .withMessage('Language is required')
        .isIn(['en', 'ta', 'hi'])
        .withMessage('Unsupported language'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateOCRUpload,
    validateTTSRequest
};
