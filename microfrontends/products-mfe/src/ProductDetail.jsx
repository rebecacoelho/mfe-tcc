import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from './api';
import { emitAddToCart, formatPrice } from './eventBus';

/**
 * Componente exposto via Module Federation como 'productsMfe/ProductDetail'.
 * Usa useParams do react-router-dom compartilhado com o shell.
 */
export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api
      .getProduct(id)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="state-msg">Carregando…</p>;
  if (error) return <p className="state-msg error">{error}</p>;

  const handleAdd = () => {
    emitAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-detail">
      <img src={product.image} alt={product.name} />
      <div>
        <span className="card-category">{product.category}</span>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p className="card-price big">{formatPrice(product.price)}</p>
        <p className="stock">{product.stock} em estoque</p>
        <button className="btn btn-primary" onClick={handleAdd}>
          {added ? '✓ Adicionado!' : 'Adicionar ao carrinho'}
        </button>
        <Link to="/" className="back-link">
          ← Voltar para produtos
        </Link>
      </div>
    </div>
  );
}
