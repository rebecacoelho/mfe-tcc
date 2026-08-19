import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../cart/CartContext';
import { formatPrice } from '../components/ProductCard';

export default function CartPage() {
  const { items, updateQty, removeItem, clear, total } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [placing, setPlacing] = useState(false);

  const handleCheckout = async () => {
    setPlacing(true);
    setError(null);
    try {
      const result = await api.checkout(
        items.map((i) => ({ id: i.id, qty: i.qty }))
      );
      setOrder(result);
      clear();
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  };

  if (order) {
    return (
      <div className="state-msg success">
        <h1>Pedido confirmado! 🎉</h1>
        <p>
          Pedido <strong>{order.orderId}</strong> — Total:{' '}
          {formatPrice(order.total)}
        </p>
        <Link to="/" className="btn btn-primary">
          Continuar comprando
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="state-msg">
        <h1>Seu carrinho está vazio</h1>
        <Link to="/" className="btn btn-primary">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1>Carrinho</h1>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Preço</th>
            <th>Qtd.</th>
            <th>Subtotal</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{formatPrice(item.price)}</td>
              <td>
                <button
                  className="btn btn-sm"
                  onClick={() => updateQty(item.id, item.qty - 1)}
                >
                  −
                </button>
                <span className="qty">{item.qty}</span>
                <button
                  className="btn btn-sm"
                  onClick={() => updateQty(item.id, item.qty + 1)}
                >
                  +
                </button>
              </td>
              <td>{formatPrice(item.price * item.qty)}</td>
              <td>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => removeItem(item.id)}
                >
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cart-footer">
        <p className="cart-total">Total: {formatPrice(total)}</p>
        <button
          className="btn btn-primary"
          onClick={handleCheckout}
          disabled={placing}
        >
          {placing ? 'Finalizando…' : 'Finalizar compra'}
        </button>
      </div>
      {error && <p className="state-msg error">{error}</p>}
    </>
  );
}
