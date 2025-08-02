import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // exemplo: "meu-projeto.appspot.com"
  });
}

console.log('[Firebase] Private Key OK:', process.env.FIREBASE_PRIVATE_KEY?.includes('\n'));

export const db = admin.firestore();
export const auth = admin.auth();
export const bucket = admin.storage().bucket(); // ✅ Exporta o bucket do Storage
export default admin;
