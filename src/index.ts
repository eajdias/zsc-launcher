import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import * as tar from 'tar';

// Configuration
const HUB_API_URL = process.env.LAUNCHER_HUB_URL || 'https://api.yourdomain.com/v1/download';

async function main() {
  const args = process.argv.slice(2);
  const product = args[0];

  if (!product) {
    console.error('❌ Error: Product ID is missing. Usage: npx <your-launcher-pkg> <product-id>');
    process.exit(1);
  }

  // Determine which env var to look for based on product, or use a generic one
  const licenseEnvKey = `LAUNCHER_${product.toUpperCase().replace(/-/g, '_')}_LICENSE_KEY`;
  const license = process.env[licenseEnvKey] || process.env.LAUNCHER_LICENSE_KEY;

  if (!license) {
    console.error(`❌ Error: Missing license key. Please set the ${licenseEnvKey} or LAUNCHER_LICENSE_KEY environment variable.`);
    process.exit(1);
  }

  if (HUB_API_URL.startsWith('http://') && !HUB_API_URL.includes('localhost')) {
    console.warn('⚠️ Warning: Using insecure HTTP connection for Launcher Hub API.');
  }

  console.log(`🚀 Launcher: Initializing product '${product}'...`);

  try {
    // 1. Authenticate and Download via Stream
    console.log(`📡 Requesting payload from Launcher Hub...`);
    const authUrl = `${HUB_API_URL}?product=${encodeURIComponent(product)}`;
    
    const tgzResponse = await fetch(authUrl, {
      headers: {
        'Authorization': `Bearer ${license}`
      }
    });
    
    if (!tgzResponse.ok) {
      let errorMsg = tgzResponse.statusText;
      const isJson = tgzResponse.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        try {
          const errJson = await tgzResponse.json();
          if (errJson.error) errorMsg = errJson.error;
        } catch (e) { /* ignore */ }
      }
      throw new Error(`Hub Error (${tgzResponse.status}): ${errorMsg}`);
    }

    const version = tgzResponse.headers.get('X-Package-Version') || 'unknown';
    console.log(`✅ License validated. Target version: ${version}`);
    console.log(`⬇️  Downloading and extracting secure payload...`);

    if (!tgzResponse.body) {
      throw new Error('No body in download response.');
    }

    // 2. Prepare temporary directory
    const tmpDirPrefix = path.join(os.tmpdir(), `launcher-${product}-`);
    const extractDir = fs.mkdtempSync(tmpDirPrefix);
    
    // 3. Extract via stream
    // Convert Web ReadableStream to Node.js Readable stream
    const { Readable } = require('stream');
    const bodyStream = Readable.fromWeb(tgzResponse.body as any);

    await new Promise((resolve, reject) => {
      bodyStream.pipe(tar.x({
        C: extractDir,
        strip: 1 // Strips the default 'package/' root directory inside npm tarballs
      }))
      .on('finish', resolve)
      .on('error', reject);
    });

    console.log(`📦 Payload extracted successfully to temporary space.`);

    // 4. Execute the extracted payload
    // Assuming the package exposes a bin entry or we run dist/server.cjs
    // We will look for package.json to find the bin or fallback to dist/server.cjs
    const packageJsonPath = path.join(extractDir, 'package.json');
    let executablePath = path.join(extractDir, 'dist/server.cjs'); // Default fallback

    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (pkg.bin) {
        // bin can be a string or an object
        if (typeof pkg.bin === 'string') {
          executablePath = path.join(extractDir, pkg.bin);
        } else if (typeof pkg.bin === 'object') {
          // just pick the first one, or specifically look for product name
          const binName = Object.keys(pkg.bin)[0];
          executablePath = path.join(extractDir, pkg.bin[binName]);
        }
      }
    }

    if (!fs.existsSync(executablePath)) {
      throw new Error(`Executable not found at ${executablePath}`);
    }

    console.log(`🔥 Starting ${product}...\n`);

    // Pass the remaining arguments to the underlying process
    const childArgs = args.slice(1);
    
    // Environment Variable Handling
    // As a generic launcher, we default to passing the full process.env so any product works natively.
    // For strict security, users can define LAUNCHER_FORWARD_ENV="VAR1,VAR2" to explicitly allowlist vars.
    let childEnv = process.env;

    if (process.env.LAUNCHER_FORWARD_ENV) {
      const allowedKeys = process.env.LAUNCHER_FORWARD_ENV.split(',').map(k => k.trim());
      
      const safeEnv: Record<string, string | undefined> = {
        PATH: process.env.PATH,
        NODE_ENV: process.env.NODE_ENV,
        [licenseEnvKey]: license
      };

      for (const key of allowedKeys) {
        if (process.env[key] !== undefined) {
          safeEnv[key] = process.env[key];
        }
      }

      // Always forward LAUNCHER_ prefixed configuration variables
      for (const key in process.env) {
        if (key.startsWith('LAUNCHER_') && !safeEnv[key]) {
          safeEnv[key] = process.env[key];
        }
      }

      childEnv = safeEnv as NodeJS.ProcessEnv;
    }

    child_process.execSync(`node "${executablePath}" ${childArgs.join(' ')}`, {
      stdio: 'inherit',
      env: childEnv
    });

    // Note: We don't automatically clean up the temp dir immediately if the process is meant to stay alive
    // as a server. If execSync blocks (like a server), it will stay here. 
    // Once it exits, we could clean it up.
    
    try {
      fs.rmSync(extractDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }

  } catch (error: any) {
    console.error(`\n❌ Launcher Error:`);
    console.error(error.message);
    process.exit(1);
  }
}

main();
