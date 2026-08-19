import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import ProductList from './ProductList';
import ProductDetail from './ProductDetail';

/**
 * App standalone: permite rodar o products-mfe de forma independente,
 * sem o shell — demonstrando o deploy/desenvolvimento independente dos MFEs.
 */
export default function App() {
  return (
    <BrowserRouter>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            📦 products-mfe <span className="badge-arch">standalone</span>
          </Link>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
