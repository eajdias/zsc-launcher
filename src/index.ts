import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import * as tar from 'tar';

// Configuration
// Using localhost for local validation loop testing
const HUB_API_URL = 'http://localhost:3001/api/v1/download';

async function main() {
  const args = process.argv.slice(2);
  const product = args[0];

  if (!product) {
    console.error('❌ Error: Product ID is missing. Usage: npx @eajdias/zscan-run <product-id>');
    process.exit(1);
  }

  // Determine which env var to look for based on product, or use a generic one
  const licenseEnvKey = `ZSCAN_${product.toUpperCase().replace(/-/g, '_')}_LICENSE_KEY`;
  const license = process.env[licenseEnvKey] || process.env.ZSCAN_LICENSE_KEY;

  if (!license) {
    console.error(`❌ Error: Missing license key. Please set the ${licenseEnvKey} environment variable.`);
    process.exit(1);
  }

  console.log(`🚀 Zscan Launcher: Initializing product '${product}'...`);

  try {
    // 1. Authenticate and Download via Stream
    console.log(`📡 Requesting payload from Zscan Hub...`);
    const authUrl = `${HUB_API_URL}?product=${encodeURIComponent(product)}&token=${encodeURIComponent(license)}`;
    
    const tgzResponse = await fetch(authUrl);
    
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
    const tmpDirPrefix = path.join(os.tmpdir(), `zscan-${product}-`);
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
    
    child_process.execSync(`node "${executablePath}" ${childArgs.join(' ')}`, {
      stdio: 'inherit',
      env: process.env // Pass current environment variables (including license) down
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
    console.error(`\n❌ Zscan Launcher Error:`);
    console.error(error.message);
    process.exit(1);
  }
}

main();
