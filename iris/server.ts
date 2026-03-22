import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock Stock Data
  let stock = [
    { id: "1", name: "Café Três Corações 500g", quantity: 0, unit: "unidades" },
    { id: "2", name: "Açúcar União 1kg", quantity: 50, unit: "unidades" },
  ];

  app.get("/api/stock", (req, res) => {
    res.json(stock);
  });

  app.post("/api/stock/update", express.json(), (req, res) => {
    const { name, quantityChange } = req.body;
    const item = stock.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
    if (item) {
      item.quantity += quantityChange;
      res.json({ success: true, item });
    } else {
      res.status(404).json({ success: false, message: "Item não encontrado" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
