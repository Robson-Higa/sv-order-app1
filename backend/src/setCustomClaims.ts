import * as admin from 'firebase-admin';
import * as serviceAccount from './firebase-service-account.json'; // caminho relativo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

async function setClaims() {
  const uid = 'vSyorvPiSfM4RJuPDeqi7pH7gZ03';
  const userType = 'ADMIN'; // ou TECHNICIAN, END_USER

  try {
    await admin.auth().setCustomUserClaims(uid, { userType });
    console.log(`✅ Custom claim '${userType}' definido para o usuário ${uid}`);
  } catch (error) {
    console.error('❌ Erro ao definir custom claim:', error);
  }
}

setClaims();
