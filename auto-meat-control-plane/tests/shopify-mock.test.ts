import { describe, expect, it } from "vitest";
import { createMockShopifyConnector } from "../src/connectors/shopify-mock.js";

describe("Shopify mock connector", () => {
  it("is read-only mock with no write methods", async () => {
    const shopify = createMockShopifyConnector();
    expect(shopify.mode).toBe("mock");
    expect(shopify.readOnly).toBe(true);
    expect(Object.keys(shopify).sort()).toEqual(
      ["getOrders", "getProducts", "healthCheck", "mode", "readOnly"].sort(),
    );
    const products = await shopify.getProducts();
    expect(products.length).toBeGreaterThan(0);
  });
});
