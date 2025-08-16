// routes/publicAuth.js
import express from 'express';
import { publicRegister } from '../../src/controllers/publicAuthController.js';

const router = express.Router();
router.post('/public-register', publicRegister);

export default router;
