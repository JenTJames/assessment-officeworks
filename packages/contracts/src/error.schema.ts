import { z } from "zod";

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    fields: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
