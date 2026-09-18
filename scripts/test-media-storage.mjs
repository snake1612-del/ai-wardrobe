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
if (status.status !== 0)
  throw new Error("Local Supabase is required for Storage integration tests");
const local = parseEnvironment(status.stdout);
const apiUrl = local.API_URL;
const publishableKey = local.PUBLISHABLE_KEY ?? local.ANON_KEY;
const secretKey = local.SECRET_KEY ?? local.SERVICE_ROLE_KEY;
if (!apiUrl || !publishableKey || !secretKey)
  throw new Error("Local Supabase environment is incomplete");

const admin = createClient(apiUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const suffix = randomUUID();
const emailA = `media-storage-a-${suffix}@example.test`;
const emailB = `media-storage-b-${suffix}@example.test`;
const password = "phase9-storage-password";
const accountA = randomUUID();
const accountB = randomUUID();
const itemA = randomUUID();
const itemB = randomUUID();
const createdUsers = [];
const createdObjects = [];

function userClient() {
  return createClient(apiUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function uploadTus(client, intent, bytes, { failFirst = false } = {}) {
  const { data: sessionData } = await client.auth.getSession();
  assert.ok(sessionData.session?.access_token, "authenticated session is required");
  const baseStack = new tus.DefaultHttpStack();
  let injectedFailure = false;
  const httpStack = failFirst
    ? {
        getName: () => "phase9-flaky-stack",
        createRequest(method, url) {
          const request = baseStack.createRequest(method, url);
          if (!injectedFailure && method === "POST") {
            injectedFailure = true;
            request.send = async () => {
              throw new Error("synthetic retryable transport failure");
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
        authorization: `Bearer ${sessionData.session.access_token}`,
        apikey: publishableKey,
      },
      metadata: {
        bucketName: intent.storage_bucket,
        objectName: intent.storage_object_key,
        contentType: "image/webp",
        cacheControl: "0",
      },
      onSuccess: resolve,
      onError: reject,
    }).start();
  });
  assert.equal(failFirst ? injectedFailure : true, true);
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

async function createIntent(accountId, assetId, itemId, key) {
  const { data, error } = await admin
    .rpc("create_media_upload_intent", {
      p_account_id: accountId,
      p_asset_id: assetId,
      p_item_id: itemId,
      p_appearance_variant_id: null,
      p_original_filename: "fixture.webp",
      p_declared_mime_type: "image/webp",
      p_declared_byte_size: 38,
      p_product_role: "catalog",
      p_image_view: "front",
      p_replaces_asset_id: null,
      p_idempotency_key: key,
      p_request_hash: `\\x${"11".repeat(32)}`,
    })
    .single();
  if (error) throw error;
  return data;
}

try {
  for (const email of [emailA, emailB]) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("user provisioning failed");
    createdUsers.push(data.user.id);
  }
  for (const [userId, accountId] of [
    [createdUsers[0], accountA],
    [createdUsers[1], accountB],
  ]) {
    const { error } = await admin.rpc("bootstrap_account", {
      p_auth_user_id: userId,
      p_account_id: accountId,
    });
    if (error) throw error;
  }
  const { error: itemError } = await admin.from("clothing_items").insert([
    { id: itemA, account_id: accountA, record_state: "committed", display_name: "Storage A" },
    { id: itemB, account_id: accountB, record_state: "committed", display_name: "Storage B" },
  ]);
  if (itemError) throw itemError;

  const clientA = userClient();
  const clientB = userClient();
  for (const [client, email] of [
    [clientA, emailA],
    [clientB, emailB],
  ]) {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  const assetA = randomUUID();
  const pendingA = randomUUID();
  const assetB = randomUUID();
  const intentA = await createIntent(accountA, assetA, itemA, `storage-a-${suffix}`);
  const pendingIntentA = await createIntent(
    accountA,
    pendingA,
    itemA,
    `storage-a-pending-${suffix}`,
  );
  const intentB = await createIntent(accountB, assetB, itemB, `storage-b-${suffix}`);
  const webpFixture = Buffer.from(
    "524946461e00000057454250565038200a000000000101009d012a010001000140",
    "hex",
  );

  await uploadTus(clientA, intentA, webpFixture, { failFirst: true });
  createdObjects.push([intentA.storage_bucket, intentA.storage_object_key]);

  await expectRejected(
    () => uploadTus(clientB, pendingIntentA, webpFixture),
    "User B TUS upload to User A known path must fail",
  );
  await expectRejected(async () => {
    const anonymous = userClient();
    await uploadTus(anonymous, intentB, webpFixture);
  }, "anonymous TUS upload must fail");
  await expectRejected(
    () => uploadTus(clientA, intentA, webpFixture),
    "TUS overwrite of an immutable source must fail",
  );

  const { data: originalRead, error: originalReadError } = await clientA.storage
    .from("wardrobe-originals")
    .download(intentA.storage_object_key);
  assert.equal(originalRead, null, "browser must not read an original");
  assert.ok(originalReadError, "original read denial must return an error");

  const directRendition = await clientA.storage
    .from("wardrobe-renditions")
    .upload(`accounts/${accountA}/forbidden.webp`, webpFixture, { contentType: "image/webp" });
  assert.ok(directRendition.error, "browser must not write a rendition");

  const completionArgs = {
    p_account_id: accountA,
    p_asset_id: assetA,
    p_observed_byte_size: webpFixture.length,
    p_idempotency_key: `complete-${suffix}`,
    p_request_hash: `\\x${"22".repeat(32)}`,
  };
  const firstCompletion = await admin.rpc("complete_media_upload", completionArgs);
  assert.equal(firstCompletion.error, null, "completion after Storage upload must pass");
  const duplicateCompletion = await admin.rpc("complete_media_upload", completionArgs);
  assert.equal(duplicateCompletion.error, null, "duplicate completion must replay safely");
  const { count: validationJobs } = await admin
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("media_asset_id", assetA)
    .eq("job_type", "media.validate");
  assert.equal(validationJobs, 1, "duplicate completion must create one validation job");

  const { data: bSeesA, error: bReadError } = await clientB
    .from("media_assets")
    .select("id")
    .eq("id", assetA);
  assert.equal(bReadError, null);
  assert.deepEqual(bSeesA, [], "User B must not read User A known media ID");

  console.info(
    "Storage integration passed: authenticated TUS retry, isolation, overwrite/read/write denial and completion replay.",
  );
} finally {
  for (const [bucket, objectKey] of createdObjects) {
    await admin.storage.from(bucket).remove([objectKey]);
  }
  for (const accountId of [accountA, accountB]) {
    await admin.from("jobs").delete().eq("account_id", accountId);
    await admin.from("idempotency_records").delete().eq("account_id", accountId);
    await admin.from("media_bindings").delete().eq("account_id", accountId);
    await admin.from("media_assets").delete().eq("account_id", accountId);
    await admin.from("clothing_items").delete().eq("account_id", accountId);
    await admin.from("account_preferences").delete().eq("account_id", accountId);
    await admin.from("accounts").delete().eq("id", accountId);
  }
  for (const userId of createdUsers) await admin.auth.admin.deleteUser(userId);
}
