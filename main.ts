// Fajar Bakery — Dawn Shift: hands the game in. The entry is the static
// files under game/ plus the screenshots in screenshots/. This program copies
// both folders next to this file into the output directory the platform
// provides, then writes the dossier the judge reads, built from exactly
// those files by the vendored make.fun library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Create the output folder if it is not there yet; never delete anything
// inside it, the platform owns what is already there.
mkdirSync(outputDir, { recursive: true });

// Hand over the whole game folder, exactly as it sits in the repository.
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

// Hand over the screenshots the same way, when the folder exists.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Build the dossier from the files just written, under the scorer's caps:
// at most 160 KiB of source text, 4 screenshots of at most 256 KiB each,
// game/ at most 993 files and directories and 48 MiB in all, and no path
// under game/ longer than 1000 UTF-8 bytes.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
