import { z } from "zod";

const tripNameSchema = z.string().trim().min(1, "Trip name is required");

const descriptionSchema = z.string().optional();

// Keep in sync with Currency (src/types/TCreateTrip.ts) by hand.
const currencySchema = z.object({
  name: z.string(),
  code: z.string(),
  symbol: z.string(),
  decimalDigits: z.number(),
});

export const createTripFormSchema = z.object({
  tripName: tripNameSchema,
  description: descriptionSchema,
  currency: currencySchema,
});

export type CreateTripFormData = z.infer<typeof createTripFormSchema>;
