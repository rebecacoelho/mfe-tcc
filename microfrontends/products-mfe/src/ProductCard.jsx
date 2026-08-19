import { Link } from 'react-router-dom';
import { emitAddToCart, formatPrice } from './eventBus';

export default function ProductCard({ product }) {
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
        <button
          className="btn btn-primary"
          onClick={() => emitAddToCart(product)}
        >
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
}
