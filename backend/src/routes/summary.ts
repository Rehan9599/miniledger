import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { getLoanSummary } from "../services/loan";

const router = Router();

// Summary requires authentication
router.use(authenticate);

/**
 * GET /api/summary
 * Returns a financial summary: total lent, total repaid, overdue amount
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const summary = await getLoanSummary(req.userId!);
        res.json({ summary });
    } catch (error) {
        console.error("Summary error:", error);
        res.status(500).json({ error: "Failed to generate summary" });
    }
});

export default router;