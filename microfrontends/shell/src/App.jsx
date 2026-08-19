import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import RemoteBoundary from './components/RemoteBoundary';
import { CartProvider, useCart } from './cart/CartContext';

// Módulos expostos pelos microfrontends remotos (Module Federation)
const ProductList = lazy(() => import('productsMfe/ProductList'));
const ProductDetail = lazy(() => import('productsMfe/ProductDetail'));
const CartPage = lazy(() => import('cartMfe/CartPage'));

function CartRoute() {
  const { items, updateQty, removeItem, clear, total } = useCart();
  return (
    <RemoteBoundary name="cart-mfe">
      <CartPage
        items={items}
        total={total}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onClear={clear}
      />
    </RemoteBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Header />
        <main className="container">
          <Routes>
            <Route
              path="/"
              element={
                <RemoteBoundary name="products-mfe">
                  <ProductList />
                </RemoteBoundary>
              }
            />
            <Route
              path="/product/:id"
              element={
                <RemoteBoundary name="products-mfe">
                  <ProductDetail />
                </RemoteBoundary>
              }
            />
            <Route path="/cart" element={<CartRoute />} />
          </Routes>
        </main>
      </CartProvider>
    </BrowserRouter>
  );
}
