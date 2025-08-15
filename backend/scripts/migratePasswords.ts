import { db } from '../src/config/firebase';
import { hashPassword } from '../src/utils/helpers';

async function migrate() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  for (const doc of snapshot.docs) {
    const user = doc.data();
    if (user.password && !user.password.startsWith('$2b$')) {
      const hashed = await hashPassword(user.password);
      await doc.ref.update({ password: hashed });
      console.log(`Senha migrada para hash para: ${user.email}`);
    }
  }
  console.log('Migração concluída.');
  process.exit(0);
}

migrate();