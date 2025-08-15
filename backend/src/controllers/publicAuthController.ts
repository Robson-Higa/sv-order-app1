// controllers/publicAuthController.js
import { Request, Response } from 'express';
import admin, { db } from '../config/firebase'; // Admin SDK
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.FRONTEND_URL}/oauth-success`; // frontend recebe token
interface PublicRegisterBody {
  uid?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  establishmentId: string;
  position: string;
  userType?: string;
}

export const googleLoginRedirect = (req: Request, res: Response) => {
  const scope = encodeURIComponent('email profile');
  const redirectUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${process.env.FRONTEND_URL}/oauth-success&` +
    `response_type=code&` +
    `scope=${scope}&` +
    `access_type=offline&prompt=consent`;

  res.redirect(redirectUrl);
};

export const googleLoginCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Código OAuth não fornecido');

  try {
    // Troca code por token no Google
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code: code as string,
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      })
    );

    const { access_token, id_token } = tokenRes.data;

    // Aqui você pode criar seu customToken Firebase ou JWT
    const customToken = id_token; // exemplo simples

    // Redireciona popup para o frontend
    return res.redirect(`${REDIRECT_URI}?token=${customToken}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Erro ao trocar code por token');
  }
};

export const publicRegister = async (
  req: Request<any, any, PublicRegisterBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, email, phone, establishmentId, position, password } = req.body;

    // 1. Criar usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Salvar dados no Firestore
    const userData = {
      uid: userRecord.uid,
      name,
      email,
      phone,
      establishmentId,
      position,
      userType: 'end_user',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({ message: 'Cadastro realizado com sucesso', user: userData });
    return; // <-- garante que TypeScript veja retorno
  } catch (error: any) {
    console.error('Erro no cadastro público:', error);

    if (error.code === 'auth/email-already-exists') {
      res.status(400).json({ message: 'Email já cadastrado' });
      return;
    }

    res.status(500).json({ message: 'Erro ao cadastrar usuário' });
  }
};

export const getPublicEstablishments = async (req: Request, res: Response) => {
  try {
    const snapshot = await admin.firestore().collection('establishments').orderBy('name').get();
    const establishments = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
    res.json(establishments);
  } catch (error) {
    console.error('Erro ao buscar estabelecimentos:', error);
    res.status(500).json({ message: 'Erro ao buscar estabelecimentos' });
  }
};
