import { Request, Response } from "express";
import { titleService } from "../services/titleService";

export class TitleController {
  static async getAllTitles(req: Request, res: Response) {
    try {
      const titles = await titleService.getAll();
      res.status(200).json({ titles });
    } catch (error) {
      console.error("Erro ao buscar títulos:", error);
      res.status(500).json({ error: "Erro ao buscar títulos" });
    }
  }

 static async createTitle(req: Request, res: Response): Promise<void> {
  try {
    const { title } = req.body;
    if (!title || title.trim() === "") {
      res.status(400).json({ error: "O título é obrigatório" });
      return;
    }

    const newTitle = await titleService.create(title);
    res.status(201).json({ message: "Título criado com sucesso", title: newTitle });
  } catch (error) {
    console.error("Erro ao criar título:", error);
    res.status(500).json({ error: "Erro ao criar título" });
  }
}

  static async updateTitle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title } = req.body;
      if (!title || title.trim() === "") {
     res.status(400).json({ error: "O título é obrigatório" });
     return
      }
      await titleService.update(id, title);
      res.status(200).json({ message: "Título atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar título:", error);
      res.status(500).json({ error: "Erro ao atualizar título" });
    }
  }

  static async deleteTitle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await titleService.delete(id);
      res.status(200).json({ message: "Título deletado com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar título:", error);
      res.status(500).json({ error: "Erro ao deletar título" });
    }
  }
  
}
