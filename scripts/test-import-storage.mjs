import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";
import * as tus from "tus-js-client";

function parseEnvironment(output) {
  const environment = {};
  for (const line of output.split(/\r?\n/u)) {
    const match = /^([A-Z0-9_]+)=(?:"([^"]*)"|'([^']*)'|(.*))$/u.exec(line.trim());
    if (match) environment[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return environment;
}

const status = spawnSync("pnpm", ["exec", "supabase", "status", "--output", "env"], {
  encoding: "utf8",
});
if (status.status !== 0) throw new Error("Local Supabase is required for import Storage tests");
const local = parseEnvironment(status.stdout);
const apiUrl = local.API_URL;
const publishableKey = local.PUBLISHABLE_KEY ?? local.ANON_KEY;
const secretKey = local.SECRET_KEY ?? local.SERVICE_ROLE_KEY;
if (!apiUrl || !publishableKey || !secretKey) throw new Error("Supabase environment is incomplete");

const admin = createClient(apiUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const suffix = randomUUID();
const password = "phase10-storage-password";
const emailA = `import-storage-a-${suffix}@example.test`;
const emailB = `import-storage-b-${suffix}@example.test`;
const accounts = [randomUUID(), randomUUID()];
const users = [];
const objects = [];

function userClient() {
  return createClient(apiUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function createIntent(accountId, size, key) {
  const sessionId = randomUUID();
  const partId = randomUUID();
  const { data, error } = await admin.rpc("create_import_session_intent", {
    p_account_id: accountId,
    p_session_id: sessionId,
    p_parts: [{ part_id: partId, ordinal: 0, byte_size: size }],
    p_idempotency_key: key,
    p_request_hash: `\\x${"11".repeat(32)}`,
  });
  if (error) throw error;
  return { sessionId, partId, part: data.parts[0] };
}

async function uploadTus(client, part, bytes, failFirst = false) {
  const { data } = await client.auth.getSession();
  assert.ok(data.session?.access_token, "authenticated session required");
  const baseStack = new tus.DefaultHttpStack();
  let injected = false;
  const httpStack = failFirst
    ? {
        getName: () => "phase10-flaky-stack",
        createRequest(method, url) {
          const request = baseStack.createRequest(method, url);
          if (!injected && method === "POST") {
            injected = true;
            request.send = async () => {
              throw new Error("synthetic retry");
            };
          }
          return request;
        },
      }
    : baseStack;
  await new Promise((resolve, reject) => {
    new tus.Upload(bytes, {
      endpoint: `${apiUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 50, 100],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      storeFingerprintForResuming: false,
      httpStack,
      headers: {
        authorization: `Bearer ${data.session.access_token}`,
        apikey: publishableKey,
      },
      metadata: {
        bucketName: part.bucket,
        objectName: part.object_key,
        contentType: "application/zip",
        cacheControl: "0",
      },
      onSuccess: () => resolve(),
      onError: reject,
    }).start();
  });
  if (failFirst) assert.equal(injected, true, "retry fault was injected");
}

async function expectRejected(operation, message) {
  let rejected = false;
  try {
    await operation();
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true, message);
}

try {
  for (const email of [emailA, emailB]) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("user provisioning failed");
    users.push(data.user.id);
  }
  for (const [index, userId] of users.entries()) {
    const { error } = await admin.rpc("bootstrap_account", {
      p_auth_user_id: userId,
      p_account_id: accounts[index],
    });
    if (error) throw error;
  }
  const clientA = userClient();
  const clientB = userClient();
  await clientA.auth.signInWithPassword({ email: emailA, password });
  await clientB.auth.signInWithPassword({ email: emailB, password });
  const bytes = Buffer.from("PK\u0003\u0004synthetic-private-archive", "binary");
  const intentA = await createIntent(accounts[0], bytes.length, `intent-a-${suffix}`);
  const intentB = await createIntent(accounts[1], bytes.length, `intent-b-${suffix}`);

  await uploadTus(clientA, intentA.part, bytes, true);
  objects.push(["wardrobe-imports", intentA.part.object_key]);
  await expectRejected(
    () => uploadTus(clientB, intentA.part, bytes),
    "User B must not upload to User A known import path",
  );
  await expectRejected(async () => {
    await uploadTus(userClient(), intentB.part, bytes);
  }, "anonymous import upload must fail");
  await expectRejected(
    () => uploadTus(clientA, intentA.part, bytes),
    "immutable import archive overwrite must fail",
  );

  const directRead = await clientA.storage
    .from("wardrobe-imports")
    .download(intentA.part.object_key);
  assert.equal(directRead.data, null, "browser must not read staged archives");
  assert.ok(directRead.error, "direct archive denial must return an error");

  const completion = {
    p_account_id: accounts[0],
    p_session_id: intentA.sessionId,
    p_part_id: intentA.partId,
    p_observed_byte_size: bytes.length,
  };
  assert.equal((await admin.rpc("complete_import_archive_part", completion)).error, null);
  assert.equal((await admin.rpc("complete_import_archive_part", completion)).error, null);
  const { count } = await admin
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("import_session_id", intentA.sessionId)
    .eq("job_type", "import.parse");
  assert.equal(count, 1, "duplicate completion creates one parse job");

  const { data: foreignRead, error: foreignError } = await clientB
    .from("import_sessions")
    .select("id")
    .eq("id", intentA.sessionId);
  assert.equal(foreignError, null);
  assert.deepEqual(foreignRead, [], "User B cannot read User A known session");
  console.info(
    "Import Storage integration passed: TUS retry, overwrite/read denial, isolation and completion replay.",
  );
} finally {
  for (const [bucket, key] of objects) await admin.storage.from(bucket).remove([key]);
  for (const accountId of accounts) {
    await admin.from("jobs").delete().eq("account_id", accountId);
    await admin.from("idempotency_records").delete().eq("account_id", accountId);
    await admin.from("import_asset_links").delete().eq("account_id", accountId);
    await admin.from("import_records").delete().eq("account_id", accountId);
    await admin.from("import_archive_parts").delete().eq("account_id", accountId);
    await admin.from("import_sessions").delete().eq("account_id", accountId);
    await admin.from("import_sources").delete().eq("account_id", accountId);
    await admin.from("account_preferences").delete().eq("account_id", accountId);
    await admin.from("accounts").delete().eq("id", accountId);
  }
  for (const userId of users) await admin.auth.admin.deleteUser(userId);
}
