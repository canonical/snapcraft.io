import {
  lstat,
  mkdir,
  readlink,
  realpath,
  symlink,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourcePath = path.join(
  repoRoot,
  "node_modules",
  "@canonical",
  "ds-assets",
  "icons",
);
const targetPath = path.join(repoRoot, "static", "icons");
const legacyTargetPath = path.join(repoRoot, "icons");

async function pathExists(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function main() {
  if (!(await pathExists(sourcePath))) {
    console.error(
      "Cannot link DS icons: node_modules/@canonical/ds-assets/icons " +
        "does not exist. Run yarn install first.",
    );
    process.exit(1);
  }

  const sourceRealPath = await realpath(sourcePath);
  await mkdir(path.dirname(targetPath), { recursive: true });

  if (await pathExists(legacyTargetPath)) {
    const legacyTargetStat = await lstat(legacyTargetPath);

    if (legacyTargetStat.isSymbolicLink()) {
      const legacyLinkTarget = await readlink(legacyTargetPath);
      const legacyLinkRealPath = await realpath(
        path.resolve(path.dirname(legacyTargetPath), legacyLinkTarget),
      ).catch(() => null);

      if (legacyLinkRealPath === sourceRealPath) {
        await unlink(legacyTargetPath);
      }
    }
  }

  if (await pathExists(targetPath)) {
    const targetStat = await lstat(targetPath);

    if (!targetStat.isSymbolicLink()) {
      console.error(
        "Cannot link DS icons: static/icons already exists and is not a " +
          "symlink.",
      );
      process.exit(1);
    }

    const linkTarget = await readlink(targetPath);
    const linkRealPath = await realpath(
      path.resolve(path.dirname(targetPath), linkTarget),
    ).catch(() => null);

    if (linkRealPath === sourceRealPath) {
      console.log("DS icons already linked.");
      return;
    }

    await unlink(targetPath);
  }

  await symlink(
    path.relative(path.dirname(targetPath), sourcePath),
    targetPath,
    "dir",
  );
  console.log(
    "Linked static/icons to node_modules/@canonical/ds-assets/icons.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
