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
    // node-fetch is built-in or dynamically resolved, tar is a node module.
    // we can bundle tar or keep it external. Given it's a launcher, bundling 
    // reduces node_modules size, but let's just mark standard node built-ins as external.
    external: [
      'fs', 'path', 'os', 'child_process', 'stream',
      // tar has some native/C++ optional deps in older versions or relies on node-gyp? 
      // Actually modern node-tar is pure JS. Let's bundle it so the launcher has zero prod dependencies!
    ],
    minify: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  });
  
  // Make the output executable
  fs.chmodSync('bin/run.cjs', 0o755);
  console.log('✅ Launcher built successfully to bin/run.cjs');
}

build().catch(() => process.exit(1));
