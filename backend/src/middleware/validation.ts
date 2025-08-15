import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { UserType, Priority } from '../types';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array(),
    });
  }
  return next();
};

export const validateLoginWithIdToken = [
  body('idToken').isString().notEmpty().withMessage('idToken é obrigatório'),
  handleValidationErrors,
];

export const validateRegister = [
  body('email').isEmail().withMessage('Email deve ser válido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('name').isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres').trim(),
  body('userType').isIn(Object.values(UserType)).withMessage('Tipo de usuário inválido'),
  body('establishmentId')
    .optional()
    .isString()
    .withMessage('ID do estabelecimento deve ser uma string'),
  handleValidationErrors,
];

export const validateServiceOrder = [
  body('title').notEmpty().withMessage('Título é obrigatório'),
  body('description').notEmpty().withMessage('Descrição é obrigatória'),
  body('priority').notEmpty().withMessage('Prioridade é obrigatória'),
  body('establishmentName').notEmpty().withMessage('Nome do estabelecimento é obrigatório'),
  body('technicianName').notEmpty().withMessage('Nome do técnico é obrigatório'),
];

export const validateEstablishment = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  handleValidationErrors,
];

export const validateFeedback = [
  body('feedback')
    .isLength({ min: 10, max: 500 })
    .withMessage('Feedback deve ter entre 10 e 500 caracteres')
    .trim(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Avaliação deve ser um número entre 1 e 5'),
  handleValidationErrors,
];
