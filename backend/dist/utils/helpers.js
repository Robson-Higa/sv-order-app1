"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderNumber = exports.formatPhone = exports.validatePhone = exports.validateEmail = exports.sanitizeUser = exports.calculateDaysBetween = exports.formatDate = exports.generateId = exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hashedPassword) => {
    return await bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ user: { id: user.id, email: user.email, userType: user.userType } }, process.env.JWT_SECRET || 'default-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
exports.generateToken = generateToken;
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
exports.generateId = generateId;
const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};
exports.formatDate = formatDate;
const calculateDaysBetween = (startDate, endDate) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
exports.calculateDaysBetween = calculateDaysBetween;
const sanitizeUser = (user) => {
    const { ...sanitizedUser } = user;
    return sanitizedUser;
};
exports.sanitizeUser = sanitizeUser;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePhone = (phone) => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
};
exports.validatePhone = validatePhone;
const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    else if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
};
exports.formatPhone = formatPhone;
const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `OS${timestamp.slice(-6)}${random}`;
};
exports.generateOrderNumber = generateOrderNumber;
//# sourceMappingURL=helpers.js.map