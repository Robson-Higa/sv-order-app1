import { db, auth } from './config/firebase';

async function testFirebaseConnection() {
  try {
    const usersSnapshot = await db.collection('users').limit(1).get();
    console.log(`Firestore conectado. Total de documentos: ${usersSnapshot.size}`);

    const listUsers = await auth.listUsers(1);
    console.log(`Auth conectado. Usuário de teste:`, listUsers.users[0]?.email || 'nenhum');
  } catch (error) {
    console.error('Erro ao testar conexão com Firebase:', error);
  }
}

testFirebaseConnection();
