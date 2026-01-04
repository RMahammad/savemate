import {
  ErrorEnvelopeSchema,
  type ErrorEnvelope,
} from "@savemate/shared-validation";

export type NormalizedError = ErrorEnvelope;

export function normalizeUnknownError(
  input: unknown,
  requestIdFallback = "unknown"
): NormalizedError {
  const parsed = ErrorEnvelopeSchema.safeParse(input);
  if (parsed.success) return parsed.data;

  return {
    error: {
      code: "INTERNAL",
      message: "Unexpected error",
      details: input,
      requestId: requestIdFallback,
    },
  };
}
