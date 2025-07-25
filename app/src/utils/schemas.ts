import z from "zod";

const DEFAULT_TEXT_LENGTH = 256;
export const loginSchema = z.object({
  email: z.email("error.validator.email"),
  password: z.string().min(8),
});

export const errors = {
  specialCharacterErrorMessage: "error.validator.password.specialCharacter",
  lowercaseErrorMessage: "error.validator.password.lowerCase",
  uppercaseErrorMessage: "error.validator.password.upperCase",
  maxLengthErrorMessage: "error.validator.password.max",
  minLengthErrorMessage: "error.validator.password.min",
  numberErrorMessage: "error.validator.password.number",
  passwordMismatchErrorMessage: "error.validator.password.mismatch",
};

export const passwordSchema = z
  .string()
  .min(8, { message: errors.minLengthErrorMessage })
  .max(20, { message: errors.maxLengthErrorMessage })
  .refine((password) => /[A-Z]/.test(password), {
    message: errors.uppercaseErrorMessage,
  })
  .refine((password) => /[a-z]/.test(password), {
    message: errors.lowercaseErrorMessage,
  })
  .refine((password) => /[0-9]/.test(password), {
    message: errors.numberErrorMessage,
  })
  .refine((password) => /[!@#$%^&*]/.test(password), {
    message: errors.specialCharacterErrorMessage,
  });
export const signupValidator = z
  .object({
    name: z.string().max(DEFAULT_TEXT_LENGTH, errors.maxLengthErrorMessage),
    email: z.email(""),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: errors.passwordMismatchErrorMessage,
    path: ["confirmPassword"],
  });

export const generateReportValidator = z.object({
  portfolioId: z.string(),
  period: z.enum(["yearly", "monthly"]),
  summary: z.string(),
});
