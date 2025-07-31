import { Request, Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest, UserType } from "../types";
import { generateId } from "../utils/helpers";

export class SectorController {
  static async getSectors(req: AuthRequest, res: Response) {
    try {
      const { establishmentId } = req.params;
      const snapshot = await db.collection("establishments")
        .doc(establishmentId)
        .collection("sectors")
        .orderBy("createdAt", "desc")
        .get();

      const sectors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ sectors });
    } catch (error) {
      console.error("Erro ao listar setores:", error);
      return res.status(500).json({ error: "Erro ao listar setores." });
    }
  }

  static async createSector(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { establishmentId } = req.params;
      const { name } = req.body;

      if (!name) return res.status(400).json({ error: "Nome do setor é obrigatório" });

      const ref = db.collection("establishments").doc(establishmentId).collection("sectors");
      const snapshot = await ref.where("name", "==", name.trim()).get();

      if (!snapshot.empty) {
        return res.status(409).json({ error: "Setor já existe neste estabelecimento." });
      }

      const id = generateId();
      await ref.doc(id).set({
        name: name.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return res.status(201).json({ message: "Setor criado com sucesso", id });
    } catch (error) {
      console.error("Erro ao criar setor:", error);
      return res.status(500).json({ error: "Erro ao criar setor." });
    }
  }

  static async updateSector(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { establishmentId, sectorId } = req.params;
      const { name } = req.body;

      const docRef = db.collection("establishments")
        .doc(establishmentId)
        .collection("sectors")
        .doc(sectorId);

      if (!(await docRef.get()).exists) {
        return res.status(404).json({ error: "Setor não encontrado." });
      }

      await docRef.update({
        name: name.trim(),
        updatedAt: new Date()
      });

      return res.json({ message: "Setor atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar setor:", error);
      return res.status(500).json({ error: "Erro ao atualizar setor." });
    }
  }

  static async deleteSector(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { establishmentId, sectorId } = req.params;

      await db.collection("establishments")
        .doc(establishmentId)
        .collection("sectors")
        .doc(sectorId)
        .delete();

      return res.json({ message: "Setor excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir setor:", error);
      return res.status(500).json({ error: "Erro ao excluir setor." });
    }
  }
}
