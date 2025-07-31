import { Router } from "express";
import { TitleController } from "../controllers/TitleController";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = Router();

// ✅ Listar todos os títulos (qualquer usuário autenticado)
router.get("/", authenticateToken, TitleController.getAllTitles);

// ✅ Criar título (apenas ADMIN)
router.post("/", authenticateToken, requireAdmin, TitleController.createTitle);

// ✅ Atualizar título (apenas ADMIN)
router.patch("/:id", authenticateToken, requireAdmin, TitleController.updateTitle);

// ✅ Deletar título (apenas ADMIN)
router.delete("/:id", authenticateToken, requireAdmin, TitleController.deleteTitle);

export default router;
