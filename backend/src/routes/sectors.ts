import { Router } from "express";
import { TitleController } from "../controllers/TitleController";
import { SectorController } from "../controllers/SectorController";
import { authenticateToken } from "../middleware/auth";

const router = Router();


// Sectors
router.get("/establishments/:establishmentId/sectors", SectorController.getSectors);
router.post("/establishments/:establishmentId/sectors", authenticateToken, SectorController.createSector);
router.patch("/establishments/:establishmentId/sectors/:sectorId", authenticateToken, SectorController.updateSector);
router.delete("/establishments/:establishmentId/sectors/:sectorId", authenticateToken, SectorController.deleteSector);

export default router;
