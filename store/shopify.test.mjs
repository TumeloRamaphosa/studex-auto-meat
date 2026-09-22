import test from 'node:test';
import assert from 'node:assert/strict';
import { getProducts, getOrders } from './shopify.mjs';

test('read-only Shopify connector', async (t) => {
  const saved = { ...process.env };
  const originalFetch = globalThis.fetch;
  t.after(() => { process.env = saved; globalThis.fetch = originalFetch; });
  process.env.SHOPIFY_STORE_DOMAIN = 'studexmeat.myshopify.com';
  process.env.SHOPIFY_ADMIN_TOKEN = 'test-token';
  process.env.SHOPIFY_API_VERSION = '2026-07';

  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => url.includes('/products.json') ? { products: [{ id: 1 }] } : { orders: [{ id: 2 }] } };
  };
  assert.deepEqual(await getProducts(), { products: [{ id: 1 }] });
  assert.deepEqual(await getOrders(), { orders: [{ id: 2 }] });
  assert.equal(requests[0].url, 'https://studexmeat.myshopify.com/admin/api/2026-07/products.json?limit=50');
  assert.match(requests[1].url, /orders\.json\?status=any&limit=50$/);
  assert.equal(requests[0].options.headers['X-Shopify-Access-Token'], 'test-token');
  assert.equal(requests[0].options.method ?? 'GET', 'GET');
  assert.equal(requests[0].options.redirect, 'error');

  process.env.SHOPIFY_ADMIN_TOKEN = 'shpat_REPLACE_ME';
  await assert.rejects(getProducts(), /Set SHOPIFY_ADMIN_TOKEN/);
  assert.equal(requests.length, 2);
  process.env.SHOPIFY_ADMIN_TOKEN = 'test-token';
  process.env.SHOPIFY_STORE_DOMAIN = 'example.com';
  await assert.rejects(getProducts(), /store hostname/);
  process.env.SHOPIFY_STORE_DOMAIN = 'studexmeat.myshopify.com';
  globalThis.fetch = async () => ({ ok: false, status: 401 });
  await assert.rejects(getProducts(), /Shopify HTTP 401/);
});
