import { z } from 'zod';

/** Login form schema */
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

/** Sign up form schema */
export const signupSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/** Manual sales entry schema */
export const manualEntrySchema = z.object({
  date: z.string().min(1, 'Date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  product: z.string().trim().min(1, 'Product name is required').max(200),
  quantity: z.coerce.number().int().min(1, 'Must be at least 1').max(1_000_000),
  revenue: z.coerce.number().min(0, 'Must be non-negative').max(100_000_000),
  category: z.string().trim().max(100).optional().or(z.literal('')),
});

/** Settings display name */
export const displayNameSchema = z.string().trim().min(1, 'Name is required').max(100);

/** Email validation for reports */
export const emailRecipientSchema = z.string().trim().email('Invalid email');

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ManualEntryData = z.infer<typeof manualEntrySchema>;
