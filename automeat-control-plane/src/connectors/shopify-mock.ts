/**
 * READ-ONLY Shopify connector — mock data only. No credentials, no network.
 */

export interface MockShopifyProduct {
  id: string;
  title: string;
  sku: string;
  priceZar: number;
  inventoryUnits: number;
}

export interface MockShopifyOrder {
  id: string;
  name: string;
  customerName: string;
  totalZar: number;
  fulfillmentStatus: 'unfulfilled' | 'fulfilled';
}

export interface ShopifyReadOnlyConnector {
  readonly mode: 'READ_ONLY_MOCK';
  getProducts(): Promise<MockShopifyProduct[]>;
  getProductBySku(sku: string): Promise<MockShopifyProduct | undefined>;
  getOrders(): Promise<MockShopifyOrder[]>;
}

const EXAMPLE_PRODUCTS: MockShopifyProduct[] = [
  {
    id: 'gid://shopify/Product/EXAMPLE-1',
    title: 'Example A5 Wagyu Striploin (1kg) — DEMO',
    sku: 'STUDEX-WAGYU-STRIP-1KG-DEMO',
    priceZar: 1899,
    inventoryUnits: 12,
  },
  {
    id: 'gid://shopify/Product/EXAMPLE-2',
    title: 'Example Boerewors Bundle (2kg) — DEMO',
    sku: 'STUDEX-BOERIE-2KG-DEMO',
    priceZar: 349,
    inventoryUnits: 40,
  },
  {
    id: 'gid://shopify/Product/EXAMPLE-3',
    title: 'Example Dry-Aged T-Bone (800g) — DEMO',
    sku: 'STUDEX-TBONE-800-DEMO',
    priceZar: 429,
    inventoryUnits: 8,
  },
];

const EXAMPLE_ORDERS: MockShopifyOrder[] = [
  {
    id: 'gid://shopify/Order/EXAMPLE-1001',
    name: '#DEMO1001',
    customerName: 'Example Customer A',
    totalZar: 1899,
    fulfillmentStatus: 'unfulfilled',
  },
  {
    id: 'gid://shopify/Order/EXAMPLE-1000',
    name: '#DEMO1000',
    customerName: 'Example Customer B',
    totalZar: 698,
    fulfillmentStatus: 'fulfilled',
  },
];

export function createMockShopifyConnector(): ShopifyReadOnlyConnector {
  return {
    mode: 'READ_ONLY_MOCK',
    async getProducts() {
      return [...EXAMPLE_PRODUCTS];
    },
    async getProductBySku(sku: string) {
      return EXAMPLE_PRODUCTS.find((p) => p.sku === sku);
    },
    async getOrders() {
      return [...EXAMPLE_ORDERS];
    },
  };
}
