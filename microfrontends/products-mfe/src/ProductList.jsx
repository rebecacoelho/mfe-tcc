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
      <section className="hero">
        <h1>Ofertas da semana em tecnologia</h1>
        <p>
          Eletrônicos, periféricos e acessórios com os melhores preços e frete
          grátis para todo o Brasil.
        </p>
      </section>
      <div className="features">
        <div className="feature">
          <strong>Frete grátis</strong>
          em compras acima de R$ 199
        </div>
        <div className="feature">
          <strong>Compra segura</strong>
          seus dados protegidos
        </div>
        <div className="feature">
          <strong>Troca fácil</strong>
          devolução grátis em 7 dias
        </div>
      </div>
      <h1 className="section-title">Produtos em destaque</h1>
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}
