import { prisma } from "../prisma";

/**
 * Mock OTP Service
 * In production, this would integrate with Twilio/MSG91/etc.
 * For this demo, OTP is logged to the server console.
 */

// Generate a 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP — creates record in DB and logs to console
export async function sendOtp(phone: string): Promise<void> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Invalidate any existing unused OTPs for this phone
  await prisma.otp.updateMany({
    where: { phone, verified: false },
    data: { verified: true },
  });

  // Store the new OTP
  await prisma.otp.create({
    data: { phone, code, expiresAt },
  });

  // ========================================================
  //   MOCK OTP — In production, send via SMS gateway
  // ========================================================
  console.log(`\n======================================`);
  console.log(`  OTP for ${phone}: ${code}`);
  console.log(`  Expires in 5 minutes`);
  console.log(`======================================\n`);
}

// Verify OTP — checks code, expiry, and marks as verified
export async function verifyOtp(
  phone: string,
  code: string
): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: {
      phone,
      code,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return false;

  // Mark OTP as used
  await prisma.otp.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return true;
}