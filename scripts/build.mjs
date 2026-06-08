import * as esbuild from 'esbuild';
import fs from 'fs';

async function build() {
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'bin/run.cjs',
    format: 'cjs',
    external: [
      'fs', 'path', 'os', 'child_process', 'stream',
    ],
    minify: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  });
  
  fs.chmodSync('bin/run.cjs', 0o755);
  console.log('✅ Launcher built successfully to bin/run.cjs');
}

build().catch(() => process.exit(1));
