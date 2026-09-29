import express from "express";
import { join } from "node:path";
import { createMockShopifyConnector } from "../connectors/shopify-mock.js";
import type { ControlPlaneApp } from "../app-state.js";
import { getPublicDir } from "../config.js";

export function createServer(app: ControlPlaneApp) {
  const server = express();
  server.use(express.json());

  server.get("/api/health", (_req, res) => {
    res.json({ ok: true, dbPath: app.dbPath });
  });

  server.get("/api/dashboard", (_req, res) => {
    const agents = app.repo.listAgents();
    const missions = app.repo.listMissions();
    const tasks = app.repo.listTasks();
    const approvals = app.repo.listAllApprovals();
    const evidence = app.repo.listEvidence();
    const connector = app.repo.getConnectorStatus();
    const audit = app.repo.listAudit(50);
    res.json({
      agents,
      missions,
      tasks,
      approvals,
      evidence,
      connector,
      audit,
    });
  });

  server.get("/api/shopify/products", async (_req, res) => {
    const shopify = createMockShopifyConnector();
    const products = await shopify.getProducts();
    res.json({ mode: "mock", readOnly: true, products });
  });

  const publicDir = getPublicDir();
  server.use(express.static(publicDir));
  server.get("/", (_req, res) => {
    res.sendFile(join(publicDir, "index.html"));
  });

  return server;
}
