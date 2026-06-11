import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export { z };

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

export const OkResponseSchema = z
  .object({
    ok: z.literal(true),
  })
  .openapi("OkResponse");

export const TitleTypeSchema = z.enum(["movie", "series"]).openapi("TitleType");

export const PairCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Code must be exactly 6 digits")
  .openapi("PairCode");
