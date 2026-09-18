import { notFound } from "next/navigation";
import { z } from "zod";

import { ImportReview } from "@/modules/import/components/import-review";
import type { ImportSessionState } from "@/modules/import/model";
import { getImportReview } from "@/modules/import/server/import-queries";

export const dynamic = "force-dynamic";

export default async function ImportReviewPage({
  params,
}: Readonly<{ params: Promise<{ sessionId: string }> }>) {
  const parsed = z
    .string()
    .uuid()
    .safeParse((await params).sessionId);
  if (!parsed.success) notFound();
  const review = await getImportReview(parsed.data);
  if (!review) notFound();
  return (
    <ImportReview
      sessionId={review.session.id}
      initialState={review.session.state as ImportSessionState}
      initialVersion={Number(review.session.version)}
      revision={Number(review.session.preview_revision)}
      manifestHash={review.session.preview_manifest_hash}
      assets={review.assets}
      issues={review.issues}
      items={review.items.map((item) => ({ ...item, version: Number(item.version) }))}
      categories={review.categories}
      records={review.records}
    />
  );
}
