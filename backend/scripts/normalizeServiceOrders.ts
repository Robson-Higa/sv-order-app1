import 'dotenv/config';
import { db } from '../src/config/firebase';
import { ServiceOrderStatus, Priority } from '../src/types';

async function normalizeServiceOrders() {
    
  try {
    const ordersSnap = await db.collection('serviceOrders').get();
    let updatedCount = 0;

    for (const doc of ordersSnap.docs) {
      const data = doc.data();
      const updates: Partial<any> = {};
      let hasUpdate = false;
      const upperStatus = (data.status as string).toUpperCase() as ServiceOrderStatus;
const upperPriority = (data.priority as string).toUpperCase() as Priority;


      if (
  upperStatus !== data.status &&
  Object.values(ServiceOrderStatus).includes(upperStatus as ServiceOrderStatus)
) {
  updates.status = upperStatus as ServiceOrderStatus;
  hasUpdate = true;
}


      if (
  upperPriority !== data.priority &&
  Object.values(Priority).includes(upperPriority as Priority)
) {
  updates.priority = upperPriority as Priority;
  hasUpdate = true;
}


      if (hasUpdate) {
        await doc.ref.update(updates);
        updatedCount++;
        console.log(`✔ Documento ${doc.id} atualizado.`);
      }
    }

    console.log(`\n✅ Normalização concluída. Total atualizado: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao normalizar ordens:', error);
    process.exit(1);
  }
}

normalizeServiceOrders();
