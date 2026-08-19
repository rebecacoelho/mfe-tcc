import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import CartPage from './CartPage';
import { api as productsApi } from './productsApi';

/**
 * App standalone: roda o cart-mfe independente do shell,
 * mantendo um carrinho local de demonstração.
 */
function StandaloneCart() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    productsApi
      .getProducts()
      .then((products) => {
        setItems(products.slice(0, 2).map((p) => ({ ...p, qty: 1 })));
      })
      .catch(() => {});
  }, []);

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const updateQty = (id, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <CartPage
      items={items}
      total={total}
      onUpdateQty={updateQty}
      onRemove={removeItem}
      onClear={() => setItems([])}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            🧾 cart-mfe <span className="badge-arch">standalone</span>
          </Link>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/cart" element={<StandaloneCart />} />
          <Route path="/" element={<StandaloneCart />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
