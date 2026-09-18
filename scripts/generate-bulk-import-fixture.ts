import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createSyntheticImportFixture } from "../tests/fixtures/bulk-import/synthetic-fixture";

const outputArgument = process.argv[2];
if (!outputArgument) {
  throw new Error("Pass an explicit output path outside the repository.");
}
const output = resolve(outputArgument);
if (output.startsWith(resolve(process.cwd()) + "/")) {
  throw new Error("Synthetic ZIP must be generated outside the Git repository.");
}
await writeFile(output, await createSyntheticImportFixture(), { flag: "wx", mode: 0o600 });
console.info("Synthetic Bulk Import fixture generated at the requested external path.");
