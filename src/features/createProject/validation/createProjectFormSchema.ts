import { z } from "zod";

const projectNameSchema = z.string().trim().min(1, "Project name is required");

const descriptionSchema = z.string().optional();

const currencySchema = z.object({
  name: z.string(),
  code: z.string(),
  symbol: z.string(),
});

export const createProjectFormSchema = z.object({
  projectName: projectNameSchema,
  description: descriptionSchema,
  currency: currencySchema,
});

export type CreateProjectFormData = z.infer<typeof createProjectFormSchema>;
