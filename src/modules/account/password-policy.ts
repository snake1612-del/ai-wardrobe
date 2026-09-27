export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_POLICY_HELP = "От 8 до 128 символов и минимум одна латинская буква.";

export function getNewPasswordValidationMessage(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.length < PASSWORD_MIN_LENGTH ||
    value.length > PASSWORD_MAX_LENGTH
  ) {
    return "Пароль должен содержать от 8 до 128 символов.";
  }
  if (!/[A-Za-z]/u.test(value)) {
    return "Пароль должен содержать минимум одну латинскую букву.";
  }
  return null;
}

export function passwordsMatch(password: string, confirmation: string) {
  return password === confirmation;
}
