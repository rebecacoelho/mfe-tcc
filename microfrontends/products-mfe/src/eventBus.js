/**
 * Comunicação entre microfrontends via eventos de DOM (event bus).
 * Este MFE não conhece o carrinho: apenas publica o evento
 * 'app:add-to-cart' e o shell (dono do estado) reage a ele.
 */
export function emitAddToCart(product) {
  window.dispatchEvent(new CustomEvent('app:add-to-cart', { detail: product }));
}

export function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
