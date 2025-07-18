// src/setUserPassword.ts

import 'dotenv/config';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const uid = 'vSyorvPiSfM4RJuPDeqi7pH7gZ03';
const novaSenha = 'senhaForte123';

async function atualizarSenha() {
  try {
    const user = await admin.auth().updateUser(uid, {
      password: novaSenha,
    });

    console.log('✅ Senha atualizada com sucesso para:', user.email);
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error);
  }
}

atualizarSenha();
