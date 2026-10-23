import { z } from "zod";

// Phone number validation — Indian format (10 digits)
export const phoneSchema = z.object({
  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

// OTP verification
export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  code: z.string().length(6, "OTP must be exactly 6 digits"),
});

// Create loan entry
export const createLoanSchema = z.object({
  friendName: z
    .string()
    .min(1, "Friend name is required")
    .max(100, "Friend name is too long"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(10_000_000, "Amount exceeds maximum limit"),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
    .refine((val) => new Date(val) > new Date(), "Due date must be in the future"),
});
