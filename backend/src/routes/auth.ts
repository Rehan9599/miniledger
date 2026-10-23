import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { sendOtp, verifyOtp } from "../services/otp";
import { generateToken } from "../middleware/auth";
import { phoneSchema, verifyOtpSchema } from "../validators";

const router = Router();

/**
 * POST /api/auth/send-otp
 * Send a mock OTP to the given phone number (logged to server console)
 */
router.post("/send-otp", async (req: Request, res: Response): Promise<void> => {
    try {
        const result = phoneSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: "Validation failed",
                details: result.error.flatten().fieldErrors,
            });
            return;
        }

        const { phone } = result.data;
        await sendOtp(phone);

        res.json({
            message: "OTP sent successfully",
            hint: "Check the server console for the OTP",
        });
    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return a JWT token. Creates user if first login.
 */
router.post("/verify-otp", async (req: Request, res: Response): Promise<void> => {
    try {
        const result = verifyOtpSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: "Validation failed",
                details: result.error.flatten().fieldErrors,
            });
            return;
        }

        const { phone, code } = result.data;
        const isValid = await verifyOtp(phone, code);

        if (!isValid) {
            res.status(401).json({ error: "Invalid or expired OTP" });
            return;
        }

        // Find or create user
        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
            user = await prisma.user.create({ data: { phone } });
        }

        // Generate JWT
        const token = generateToken(user.id);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ error: "Failed to verify OTP" });
    }
});

export default router;