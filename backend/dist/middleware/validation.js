"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeedback = exports.validateEstablishment = exports.validateServiceOrder = exports.validateRegister = exports.validateLogin = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const types_1 = require("../types");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: errors.array()
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.validateLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Email deve ser válido')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres'),
    exports.handleValidationErrors
];
exports.validateRegister = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Email deve ser válido')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres'),
    (0, express_validator_1.body)('name')
        .isLength({ min: 2 })
        .withMessage('Nome deve ter pelo menos 2 caracteres')
        .trim(),
    (0, express_validator_1.body)('userType')
        .isIn(Object.values(types_1.UserType))
        .withMessage('Tipo de usuário inválido'),
    (0, express_validator_1.body)('establishmentId')
        .optional()
        .isString()
        .withMessage('ID do estabelecimento deve ser uma string'),
    exports.handleValidationErrors
];
exports.validateServiceOrder = [
    (0, express_validator_1.body)('title')
        .isLength({ min: 3, max: 100 })
        .withMessage('Título deve ter entre 3 e 100 caracteres')
        .trim(),
    (0, express_validator_1.body)('description')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Descrição deve ter entre 10 e 1000 caracteres')
        .trim(),
    (0, express_validator_1.body)('establishmentId')
        .isString()
        .withMessage('ID do estabelecimento é obrigatório'),
    (0, express_validator_1.body)('priority')
        .isIn(Object.values(types_1.Priority))
        .withMessage('Prioridade inválida'),
    (0, express_validator_1.body)('scheduledDate')
        .optional()
        .isISO8601()
        .withMessage('Data deve estar no formato ISO 8601'),
    exports.handleValidationErrors
];
exports.validateEstablishment = [
    (0, express_validator_1.body)('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres')
        .trim(),
    (0, express_validator_1.body)('address')
        .isLength({ min: 10, max: 200 })
        .withMessage('Endereço deve ter entre 10 e 200 caracteres')
        .trim(),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('pt-BR')
        .withMessage('Telefone deve ser válido'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Email deve ser válido')
        .normalizeEmail(),
    exports.handleValidationErrors
];
exports.validateFeedback = [
    (0, express_validator_1.body)('userFeedback')
        .isLength({ min: 10, max: 500 })
        .withMessage('Feedback deve ter entre 10 e 500 caracteres')
        .trim(),
    (0, express_validator_1.body)('userRating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Avaliação deve ser um número entre 1 e 5'),
    exports.handleValidationErrors
];
//# sourceMappingURL=validation.js.map