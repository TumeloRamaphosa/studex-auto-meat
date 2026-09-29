/**
 * Read-only Shopify connector interface — mock data only (Phase 1).
 * No network calls, no write methods, no production credentials.
 */

export interface ShopifyProduct {
  id: number;
  title: string;
  sku: string;
  price: string;
  inventoryQuantity: number;
  status: "active" | "draft";
}

export interface ShopifyOrder {
  id: number;
  name: string;
  financialStatus: "pending" | "paid" | "refunded";
  fulfillmentStatus: "unfulfilled" | "fulfilled" | "partial";
  totalPrice: string;
}

export interface ShopifyReadOnlyConnector {
  readonly mode: "mock";
  readonly readOnly: true;
  getProducts(): Promise<ShopifyProduct[]>;
  getOrders(): Promise<ShopifyOrder[]>;
  healthCheck(): Promise<{ healthy: boolean; detail: string }>;
}

const MOCK_PRODUCTS: ShopifyProduct[] = [
  {
    id: 1001,
    title: "StudEx Biltong Box — Student Pack",
    sku: "SX-BB-STU",
    price: "189.00",
    inventoryQuantity: 42,
    status: "active",
  },
  {
    id: 1002,
    title: "High-Protein Boerewors — 1kg",
    sku: "SX-BW-1KG",
    price: "129.00",
    inventoryQuantity: 18,
    status: "active",
  },
  {
    id: 1003,
    title: "Exam Season Meal Prep Bundle",
    sku: "SX-MP-EXAM",
    price: "349.00",
    inventoryQuantity: 7,
    status: "draft",
  },
];

const MOCK_ORDERS: ShopifyOrder[] = [
  {
    id: 5001,
    name: "#SX-DEMO-5001",
    financialStatus: "paid",
    fulfillmentStatus: "unfulfilled",
    totalPrice: "189.00",
  },
  {
    id: 5002,
    name: "#SX-DEMO-5002",
    financialStatus: "pending",
    fulfillmentStatus: "unfulfilled",
    totalPrice: "478.00",
  },
];

export function createMockShopifyConnector(): ShopifyReadOnlyConnector {
  return {
    mode: "mock",
    readOnly: true,
    async getProducts() {
      return [...MOCK_PRODUCTS];
    },
    async getOrders() {
      return [...MOCK_ORDERS];
    },
    async healthCheck() {
      return {
        healthy: true,
        detail: "Mock Shopify connector (read-only, no network)",
      };
    },
  };
}

/** Guard: ensure no write surface is accidentally added. */
export type ShopifyConnectorSurface = keyof ShopifyReadOnlyConnector;
