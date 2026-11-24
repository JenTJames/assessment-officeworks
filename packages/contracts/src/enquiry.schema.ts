import { z } from "zod";
import { productIdSchema } from "./product.schema.ts";

export const honeypotFieldName = "website";

export const enquiryLimits = {
  nameMaxLength: 100,
  emailMaxLength: 254,
  messageMaxLength: 2000,
} as const;

const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{6,20}$/, "Enter a valid phone number");

export const enquiryRequestSchema = z.object({
  productId: productIdSchema,
  name: z.string().trim().min(1, "Enter your name").max(enquiryLimits.nameMaxLength),
  email: z.email("Enter a valid email address").max(enquiryLimits.emailMaxLength),
  phone: z.union([z.literal(""), phoneNumberSchema]).optional(),
  message: z.string().trim().max(enquiryLimits.messageMaxLength).optional(),
  [honeypotFieldName]: z.string().optional(),
});

export type EnquiryRequest = z.infer<typeof enquiryRequestSchema>;

export const enquiryResponseSchema = z.object({
  status: z.literal("received"),
});

export type EnquiryResponse = z.infer<typeof enquiryResponseSchema>;
