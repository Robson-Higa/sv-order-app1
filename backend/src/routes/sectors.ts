import { Router } from "express";
import { SectorController } from "../controllers/SectorController";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/establishments/:establishmentId/sectors", authenticateToken, SectorController.getSectors);
router.post("/establishments/:establishmentId/sectors", authenticateToken, requireAdmin, SectorController.createSector);
router.patch("/establishments/:establishmentId/sectors/:sectorId", authenticateToken, requireAdmin, SectorController.updateSector);
router.delete("/establishments/:establishmentId/sectors/:sectorId", authenticateToken, requireAdmin, SectorController.deleteSector);

export default router;
