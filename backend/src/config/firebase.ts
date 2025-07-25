import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Corrige as quebras de linha da chave privada
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}
console.log('[Firebase] Private Key OK:', process.env.FIREBASE_PRIVATE_KEY?.includes('\n'));

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;

