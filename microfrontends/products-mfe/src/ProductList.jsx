import { useEffect, useState } from 'react';
import { api } from './api';
import ProductCard from './ProductCard';

/**
 * Componente exposto via Module Federation como 'productsMfe/ProductList'.
 * Também é usado standalone no modo dev deste MFE.
 */
export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="state-msg">Carregando produtos…</p>;
  if (error)
    return (
      <p className="state-msg error">
        Erro ao carregar produtos: {error}. O backend está rodando?
      </p>
    );

  return (
    <>
      <h1>Produtos</h1>
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}
