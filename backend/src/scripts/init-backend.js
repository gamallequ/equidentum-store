/**
 * First-boot setup (migrations, seed, first admin user), run by `pnpm start`
 * before the server.
 *
 * The work itself is done by medusajs-launch-utils, which only knows the
 * upstream variable names. This wrapper lets the deploy use Equidentum names
 * and hands them on under the names the package reads. The old names still
 * work so a deploy that has not renamed its variables yet keeps booting.
 */
const fs = require('fs');
const path = require('path');

// Railway sets real environment variables; locally they live in .env.
// loadEnvFile never overrides a variable that is already set.
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const RENAMED = {
  EQUIDENTUM_ADMIN_EMAIL: 'MEDUSA_ADMIN_EMAIL',
  EQUIDENTUM_ADMIN_PASSWORD: 'MEDUSA_ADMIN_PASSWORD',
  EQUIDENTUM_WORKER_MODE: 'MEDUSA_WORKER_MODE',
};

for (const [name, upstreamName] of Object.entries(RENAMED)) {
  if (process.env[name]) {
    process.env[upstreamName] = process.env[name];
  }
}

require('medusajs-launch-utils/bin/initializeBackend.js');
