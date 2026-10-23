import request from "supertest";
import app from "../src/index";
import { prisma } from "../src/prisma";

let authToken: string;

// Set up: create a user and get a token
beforeAll(async () => {
    // Send OTP
    const consoleSpy = jest.spyOn(console, "log");
    await request(app)
        .post("/api/auth/send-otp")
        .send({ phone: "8888888888" });

    // Extract OTP from logs
    let otpCode = "";
    const otpLog = consoleSpy.mock.calls.find((call) =>
        String(call[0]).includes("OTP for")
    );
    if (otpLog) {
        const match = String(otpLog[0]).match(/OTP for \d+: (\d{6})/);
        if (match) otpCode = match[1];
    }
    consoleSpy.mockRestore();

    // Verify OTP to get token
    const authRes = await request(app)
        .post("/api/auth/verify-otp")
        .send({ phone: "8888888888", code: otpCode });

    authToken = authRes.body.token;
});

afterAll(async () => {
    await prisma.otp.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
});

describe("Loans API", () => {
    let loanId: string;

    it("should create a loan entry", async () => {
        const res = await request(app)
            .post("/api/loans")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                friendName: "Test Friend",
                amount: 1500,
                dueDate: "2099-12-31",
            });

        expect(res.status).toBe(201);
        expect(res.body.loan.friendName).toBe("Test Friend");
        expect(res.body.loan.amount).toBe(1500);
        loanId = res.body.loan.id;
    });

    it("should reject loan creation without auth", async () => {
        const res = await request(app)
            .post("/api/loans")
            .send({ friendName: "No Auth", amount: 100, dueDate: "2099-12-31" });

        expect(res.status).toBe(401);
    });

    it("should list loans for the user", async () => {
        const res = await request(app)
            .get("/api/loans")
            .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.loans.length).toBeGreaterThan(0);
    });

    it("should mark a loan as repaid", async () => {
        const res = await request(app)
            .patch(`/api/loans/${loanId}/repay`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.loan.isRepaid).toBe(true);
    });

    it("should return correct summary", async () => {
        const res = await request(app)
            .get("/api/summary")
            .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.summary.totalLent).toBe(1500);
        expect(res.body.summary.totalRepaid).toBe(1500);
    });
});