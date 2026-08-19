import express from 'express';
import cors from 'cors';
import { products } from './data.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let result = products;

  if (category) {
    result = result.filter((p) => p.category === category);
  }
  if (search) {
    const term = String(search).toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }

  res.json(result);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }
  res.json(product);
});

app.get('/api/categories', (_req, res) => {
  const categories = [...new Set(products.map((p) => p.category))];
  res.json(categories);
});

app.post('/api/checkout', (req, res) => {
  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio' });
  }

  for (const item of items) {
    const product = products.find((p) => p.id === item.id);
    if (!product) {
      return res.status(404).json({ error: `Produto ${item.id} não encontrado` });
    }
    if (item.qty > product.stock) {
      return res
        .status(409)
        .json({ error: `Estoque insuficiente para ${product.name}` });
    }
  }

  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    return sum + product.price * item.qty;
  }, 0);

  res.status(201).json({
    orderId: `ORD-${Date.now()}`,
    total: Number(total.toFixed(2)),
    items: items.length,
    status: 'confirmado',
  });
});

app.listen(PORT, () => {
  console.log(`[backend] API rodando em http://localhost:${PORT}`);
});
