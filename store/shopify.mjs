// Read-only Shopify connector. Requires Node.js 22 or newer.
import { loadEnvFile } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

try {
  loadEnvFile(fileURLToPath(new URL('.env', import.meta.url)));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

async function shopify(path) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const token = process.env.SHOPIFY_ADMIN_TOKEN?.trim();
  const version = process.env.SHOPIFY_API_VERSION || '2026-07';
  if (!domain || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(domain)) {
    throw new Error('Set SHOPIFY_STORE_DOMAIN to your store hostname (without https://).');
  }
  if (!token || token === 'shpat_REPLACE_ME') {
    throw new Error('Set SHOPIFY_ADMIN_TOKEN in store/.env or the process environment.');
  }
  if (!/^\d{4}-(01|04|07|10)$/.test(version)) {
    throw new Error('SHOPIFY_API_VERSION must be a quarterly version, such as 2026-07.');
  }
  const response = await fetch(`https://${domain}/admin/api/${version}${path}`, {
    headers: { 'X-Shopify-Access-Token': token, Accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
    redirect: 'error',
  });
  if (!response.ok) {
    // Do not expose response bodies, which may contain store or customer data.
    throw new Error(`Shopify HTTP ${response.status}. Check token, read scopes, and API version.`);
  }
  return response.json();
}

export function getProducts() {
  return shopify('/products.json?limit=50');
}

export function getOrders() {
  return shopify('/orders.json?status=any&limit=50');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { products } = await getProducts();
    console.log(`${products.length} products loaded from StudEx Meat (first page, up to 50).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
