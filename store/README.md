# StudEx Meat Shopify connector

Read-only product and order access for the existing Shopify store. Requires Node.js 22+; no npm installation is needed.

From the repository root:

```sh
cp store/.env.example store/.env
# Edit store/.env locally and replace shpat_REPLACE_ME.
node store/shopify.mjs
```

Existing process environment variables take precedence over `store/.env`. The file is loaded relative to the connector, regardless of your working directory. Credentials stay in the ignored `.env` file.

```js
import { getProducts, getOrders } from './store/shopify.mjs';
const { products } = await getProducts();
const { orders } = await getOrders();
```

Both functions return the first page only (up to 50 records). This is not a complete store sync. Orders require `read_orders`; products require `read_products`. Shopify normally limits order access to the last 60 days; older orders require additional approved access. Keep order responses private.

The default API version is `2026-07`, the latest stable version on September 22, 2026. The supplied `2024-10` version is retired. This connector preserves the requested REST interface for an existing integration; REST is legacy and a new public app should use GraphQL.

References: [versioning](https://shopify.dev/docs/api/usage/versioning), [products](https://shopify.dev/docs/api/admin-rest/latest/resources/product), [orders](https://shopify.dev/docs/api/admin-rest/latest/resources/order).

Run isolated checks without store credentials:

```sh
node --test store/shopify.test.mjs
```
