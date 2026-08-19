import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../cart/CartContext';

export default function Header() {
  const { count } = useCart();

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          🛒 MiniShop <span className="badge-arch">monólito</span>
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Produtos
          </NavLink>
          <NavLink to="/cart" className="cart-link">
            Carrinho
            {count > 0 && <span className="cart-badge">{count}</span>}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
