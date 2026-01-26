const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const STORE_SLUG = import.meta.env.VITE_STORE_SLUG;
const STORE_ID = import.meta.env.VITE_STORE_ID;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(STORE_SLUG ? { 'x-store-slug': STORE_SLUG } : {}),
      ...(STORE_ID ? { 'x-store-id': STORE_ID } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function fetchProducts() {
  return request('/storefront/products');
}

export async function fetchProduct(slug) {
  return request(`/storefront/products/${slug}`);
}

export async function createCart(payload) {
  return request('/storefront/cart', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function confirmCheckout(payload) {
  return request('/storefront/checkout/confirm', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
