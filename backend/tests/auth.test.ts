import request from "supertest";
import app from "../src/index";
import { prisma } from "../src/prisma";

// Clean up after all tests
afterAll(async () => {
    await prisma.otp.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
});

describe("Auth API", () => {
    const testPhone = "9999999999";
    let otpCode: string;

    it("should send OTP for a valid phone number", async () => {
        // Spy on console.log to capture the OTP
        const consoleSpy = jest.spyOn(console, "log");

        const res = await request(app)
            .post("/api/auth/send-otp")
            .send({ phone: testPhone });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("OTP sent successfully");

        // Extract OTP from console.log calls
        const otpLog = consoleSpy.mock.calls.find((call) =>
            String(call[0]).includes("OTP for")
        );
        if (otpLog) {
            const match = String(otpLog[0]).match(/OTP for \d+: (\d{6})/);
            if (match) otpCode = match[1];
        }

        consoleSpy.mockRestore();
        expect(otpCode).toBeDefined();
    });

    it("should reject invalid phone numbers", async () => {
        const res = await request(app)
            .post("/api/auth/send-otp")
            .send({ phone: "123" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation failed");
    });

    it("should verify OTP and return a token", async () => {
        const res = await request(app)
            .post("/api/auth/verify-otp")
            .send({ phone: testPhone, code: otpCode });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.phone).toBe(testPhone);
    });

    it("should reject incorrect OTP", async () => {
        const res = await request(app)
            .post("/api/auth/verify-otp")
            .send({ phone: testPhone, code: "000000" });

        expect(res.status).toBe(401);
    });
});