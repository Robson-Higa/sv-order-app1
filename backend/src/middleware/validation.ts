import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { UserType, Priority } from '../types';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array()
    });
  }
  return next();
};

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  handleValidationErrors
];

export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('name')
    .isLength({ min: 2 })
    .withMessage('Nome deve ter pelo menos 2 caracteres')
    .trim(),
  body('userType')
    .isIn(Object.values(UserType))
    .withMessage('Tipo de usuário inválido'),
  body('establishmentId')
    .optional()
    .isString()
    .withMessage('ID do estabelecimento deve ser uma string'),
  handleValidationErrors
];

export const validateServiceOrder = [
  body('title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Título deve ter entre 3 e 100 caracteres')
    .trim(),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Descrição deve ter entre 10 e 1000 caracteres')
    .trim(),
  body('establishmentId')
    .isString()
    .withMessage('ID do estabelecimento é obrigatório'),
  body('priority')
    .isIn(Object.values(Priority))
    .withMessage('Prioridade inválida'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Data deve estar no formato ISO 8601'),
  handleValidationErrors
];

export const validateEstablishment = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('address')
    .isLength({ min: 10, max: 200 })
    .withMessage('Endereço deve ter entre 10 e 200 caracteres')
    .trim(),
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone deve ser válido'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  handleValidationErrors
];

export const validateFeedback = [
  body('userFeedback')
    .isLength({ min: 10, max: 500 })
    .withMessage('Feedback deve ter entre 10 e 500 caracteres')
    .trim(),
  body('userRating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Avaliação deve ser um número entre 1 e 5'),
  handleValidationErrors
];

