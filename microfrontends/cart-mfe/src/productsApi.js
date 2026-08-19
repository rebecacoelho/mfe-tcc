const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = {
  getProducts: () =>
    fetch(`${API_BASE}/products`).then((res) => {
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      return res.json();
    }),
};
