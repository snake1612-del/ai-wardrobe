import { z } from "zod";

import { getNewPasswordValidationMessage } from "./password-policy";

export const profileDisplayNameSchema = z
  .string()
  .trim()
  .min(1, "Введите отображаемое имя.")
  .max(80, "Имя должно содержать не более 80 символов.");

export const profileEmailSchema = z
  .string()
  .trim()
  .email("Введите корректный email.")
  .max(254, "Email слишком длинный.");

export const profilePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль.").max(128),
    newPassword: z.string().superRefine((password, context) => {
      const message = getNewPasswordValidationMessage(password);
      if (message) context.addIssue({ code: "custom", message });
    }),
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "Подтверждение нового пароля не совпадает.",
        path: ["confirmPassword"],
      });
    }
    if (value.newPassword === value.currentPassword) {
      context.addIssue({
        code: "custom",
        message: "Новый пароль должен отличаться от текущего.",
        path: ["newPassword"],
      });
    }
  });

export type ProfileActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
  version?: number;
}>;
