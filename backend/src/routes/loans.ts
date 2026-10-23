import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { authenticate } from "../middleware/auth";
import {
    createLoan,
    getUserLoans,
    markAsRepaid,
    updateReceipt,
} from "../services/loan";
import { createLoanSchema } from "../validators";

const router = Router();

// All loan routes require authentication
router.use(authenticate);

// Multer config for receipt uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path.join(__dirname, "..", "uploads"));
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `receipt-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeValid = allowedTypes.test(file.mimetype);
        if (extValid && mimeValid) {
            cb(null, true);
        } else {
            cb(new Error("Only image files (JPEG, PNG, WebP) are allowed"));
        }
    },
});

/**
 * GET /api/loans
 * List all loans for the authenticated user
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const loans = await getUserLoans(req.userId!);
        res.json({ loans });
    } catch (error) {
        console.error("Get loans error:", error);
        res.status(500).json({ error: "Failed to fetch loans" });
    }
});

/**
 * POST /api/loans
 * Create a new loan entry
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const result = createLoanSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: "Validation failed",
                details: result.error.flatten().fieldErrors,
            });
            return;
        }

        const loan = await createLoan({
            userId: req.userId!,
            ...result.data,
        });

        res.status(201).json({
            message: "Loan entry created",
            loan: { ...loan, amount: Number(loan.amount) },
        });
    } catch (error) {
        console.error("Create loan error:", error);
        res.status(500).json({ error: "Failed to create loan entry" });
    }
});

/**
 * PATCH /api/loans/:id/repay
 * Mark a loan as repaid
 */
router.patch("/:id/repay", async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await markAsRepaid(req.params.id as string, req.userId!);

        if (!result) {
            res.status(404).json({ error: "Loan not found" });
            return;
        }

        if ("alreadyRepaid" in result && result.alreadyRepaid) {
            res.status(400).json({ error: "Loan is already marked as repaid" });
            return;
        }

        res.json({ message: "Loan marked as repaid", loan: result });
    } catch (error) {
        console.error("Mark repaid error:", error);
        res.status(500).json({ error: "Failed to mark loan as repaid" });
    }
});

/**
 * POST /api/loans/:id/receipt
 * Upload a receipt photo for a loan entry
 */
router.post(
    "/:id/receipt",
    upload.single("receipt"),
    async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({ error: "No file uploaded" });
                return;
            }

            const receiptUrl = `/uploads/${req.file.filename}`;
            const loan = await updateReceipt(req.params.id as string, req.userId!, receiptUrl);

            if (!loan) {
                res.status(404).json({ error: "Loan not found" });
                return;
            }

            res.json({
                message: "Receipt uploaded successfully",
                receiptUrl,
            });
        } catch (error) {
            console.error("Upload receipt error:", error);
            res.status(500).json({ error: "Failed to upload receipt" });
        }
    }
);

export default router;