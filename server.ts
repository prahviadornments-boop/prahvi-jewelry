import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Load shipping config
  const shippingConfigPath = path.join(__dirname, "src/data/shippingConfig.json");
  let shippingConfig: any = { couriers: {}, pincodes: {} };
  
  if (fs.existsSync(shippingConfigPath)) {
    shippingConfig = JSON.parse(fs.readFileSync(shippingConfigPath, "utf-8"));
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/couriers", (req, res) => {
    res.json(Object.values(shippingConfig.couriers));
  });

  app.post("/api/calculate-shipping", (req, res) => {
    const { toPincode, weight, couriers } = req.body;
    const cleanPincode = String(toPincode || "").trim();
    
    if (!cleanPincode || weight === undefined) {
      return res.status(400).json({ error: "Missing required fields: toPincode, weight" });
    }

    const zone = shippingConfig.pincodes[cleanPincode] || "remote";
    const selectedCouriers = couriers || Object.keys(shippingConfig.couriers);
    
    const rates: any = {};
    
    selectedCouriers.forEach((courierId: string) => {
      const courier = shippingConfig.couriers[courierId];
      if (!courier) return;

      // Find weight slab
      const slab = courier.weightSlabs.find((s: any) => weight <= s.maxWeight) || courier.weightSlabs[courier.weightSlabs.length - 1];
      const baseCost = slab.rate;
      const zoneMultiplier = courier.zoneMultipliers[zone] || 1.0;
      const finalCost = Math.round(baseCost * zoneMultiplier);
      const estimatedDays = courier.estimatedDays[zone] || 5;

      rates[courierId] = {
        courierName: courier.name,
        baseCost,
        zone,
        zoneMultiplier,
        finalCost,
        estimatedDays
      };
    });

    console.log(`Shipping calculation for ${cleanPincode} (Zone: ${zone}, Weight: ${weight}kg)`);
    res.json({
      toPincode: cleanPincode,
      weight,
      zone,
      rates,
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
