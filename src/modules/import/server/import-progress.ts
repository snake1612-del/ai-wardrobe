import "server-only";

import { ApplicationError } from "@/platform/errors/application-error";

import { createImportServiceClient } from "./import-capability";

export async function getImportProgress(accountId: string, sessionId: string) {
  const { data, error } = await createImportServiceClient().rpc("get_import_progress", {
    p_account_id: accountId,
    p_session_id: sessionId,
  });
  if (error) throw new ApplicationError("transient_dependency", "Статус обработки недоступен.");
  if (!data) throw new ApplicationError("not_found", "Импорт недоступен.");
  return data;
}
