import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';

try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc',
    'src/app/services/autosave-queue.ts', '--target', 'ES2022', '--module', 'ES2022',
    '--skipLibCheck', '--outDir', '.test-build'], { stdio: 'inherit' });
  // Import directly so all individual regression cases are reported.
  await import('../tests/autosave.test.mjs');
} finally {
  rmSync('.test-build', { recursive: true, force: true });
}
