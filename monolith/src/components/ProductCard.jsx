import { Link } from 'react-router-dom';
import { useCart } from '../cart/CartContext';

export function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  return (
    <div className="card">
      <Link to={`/product/${product.id}`}>
        <img src={product.image} alt={product.name} loading="lazy" />
      </Link>
      <div className="card-body">
        <span className="card-category">{product.category}</span>
        <Link to={`/product/${product.id}`} className="card-title">
          {product.name}
        </Link>
        <p className="card-price">{formatPrice(product.price)}</p>
        <p className="card-installments">
          em até 10x de {formatPrice(product.price / 10)} sem juros
        </p>
        {product.price >= 199 && <p className="card-freeship">Frete grátis</p>}
        <button className="btn btn-primary" onClick={() => addItem(product)}>
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
}
