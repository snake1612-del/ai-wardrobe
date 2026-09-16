export type AuthActionState = Readonly<{
  status: "idle" | "error" | "success";
  message?: string;
}>;
