import { db } from "../config/firebase";

const COLLECTION = "titles";

export const titleService = {
  async getAll() {
    const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async create(title: string) {
    const newTitle = {
      title,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await db.collection(COLLECTION).add(newTitle);
    return { id: docRef.id, ...newTitle };
  },

  async update(id: string, title: string) {
    await db.collection(COLLECTION).doc(id).update({
      title,
      updatedAt: new Date()
    });
  },

  async delete(id: string) {
    await db.collection(COLLECTION).doc(id).delete();
  }
};
