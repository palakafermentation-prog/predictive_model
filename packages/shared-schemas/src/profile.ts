import { z } from "zod/v4";

export const ProfileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatarId: z.string().nullish(),
});
export type ProfileForm = z.infer<typeof ProfileFormSchema>;

export const ProfileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatarId: z.string().nullish(),
});
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
