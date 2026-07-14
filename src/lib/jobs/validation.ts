import { z } from "zod";

export const jobStatusSchema = z.enum(["DRAFT", "OPEN", "CLOSED"]);
export const employmentTypeSchema = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "TEMPORARY",
  "INTERNSHIP",
]);

const text = (max: number) => z.string().trim().min(1).max(max);

export const jobFormSchema = z.object({
  title: text(180),
  department: text(120),
  location: text(180),
  employmentType: employmentTypeSchema,
  description: text(10_000),
  requirements: text(10_000),
  status: jobStatusSchema.default("DRAFT"),
});

export const jobIdSchema = z.object({ id: z.uuid() });
export const jobMutationSchema = jobIdSchema.extend({
  version: z.coerce.number().int().positive(),
});
export const jobQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: jobStatusSchema.optional(),
  employmentType: employmentTypeSchema.optional(),
  sort: z.enum(["createdAt", "title", "status"]).default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  after: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type JobFormInput = z.infer<typeof jobFormSchema>;
export type JobQuery = z.infer<typeof jobQuerySchema>;
