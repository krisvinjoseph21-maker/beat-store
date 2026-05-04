import { z } from 'zod'

// Matches the permissive email regex used across routes — intentionally loose
// so edge-case valid addresses aren't rejected.
const emailRegex = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/

export const emailSchema = z
  .string()
  .trim()
  .min(1)
  .max(254)
  .regex(emailRegex, 'Invalid email address')

export const licenseTypeSchema = z.enum(['standard', 'premium', 'unlimited'])

const beatIdSchema = z.string().min(1).max(127)

const checkoutItemSchema = z.object({
  beatId: beatIdSchema,
  licenseType: licenseTypeSchema,
})

// Two checkout formats coexist:
//   Per-item  (CartDrawer)  — items array with per-beat license selection
//   Global    (LicenseModal) — single licenseType applied to all beatIds
export const checkoutBodySchema = z.union([
  z.object({
    items: z.array(checkoutItemSchema).min(1, 'No beats selected').max(20, 'Too many beats'),
    discountCode: z.string().max(50).optional(),
  }),
  z.object({
    beatIds: z.array(beatIdSchema).min(1, 'No beats selected').max(20, 'Too many beats'),
    licenseType: licenseTypeSchema,
    discountCode: z.string().max(50).optional(),
  }),
])

export const contactBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
})

export const bookingBodySchema = z.object({
  artistName: z.string().trim().min(1).max(100),
  email: emailSchema,
  genre: z.string().trim().min(1).max(100),
  projectType: z.string().trim().min(1).max(100),
  deadline: z.string().trim().min(1).max(50),
  budget: z.string().trim().min(1).max(100),
  referenceTracks: z.string().trim().max(2000).optional().default(''),
})

export const reviewBodySchema = z.object({
  author: z.string().trim().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().min(1).max(1000),
})

export const loopSubscriptionBodySchema = z.object({
  planId: z.enum(['1-month', '3-month', '6-month', '12-month', 'lifetime']),
})

export const recommendBodySchema = z.object({
  query: z
    .string()
    .trim()
    .min(3, 'query must be at least 3 characters')
    .max(500, 'query must be 500 characters or fewer'),
})
