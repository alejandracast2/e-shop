<script setup>
import { reactive, ref } from 'vue';
import { createOrder } from '../api';
import { useStore } from '../store';

const store = useStore();
const isSubmitting = ref(false);
const orderNotice = ref('');
const orderError = ref('');

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: ''
});

const notes = ref('');

function formIsValid() {
  return (
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.addressLine1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postalCode.trim() &&
    form.country.trim() &&
    store.state.cart.length > 0
  );
}

async function submitOrder() {
  orderNotice.value = '';
  orderError.value = '';

  if (!formIsValid()) {
    orderError.value = 'Complete required fields and add at least one item.';
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      customer: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim()
      },
      items: store.state.cart.map((item) => ({
        variantId: item.variant.id,
        quantity: item.quantity
      })),
      notes: notes.value.trim() || undefined
    };

    const order = await createOrder(payload);
    orderNotice.value = `Order ${order.id} created. We will email you soon.`;
    store.clearCart();
    notes.value = '';
  } catch (error) {
    orderError.value = error.message || 'Order failed.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="layout">
    <div>
      <div class="section-title">
        <h2>Your cart</h2>
        <button class="btn btn-ghost" type="button" @click="store.clearCart">
          Clear
        </button>
      </div>

      <div v-if="store.state.cart.length === 0" class="notice">
        Cart is empty. Add pieces from the products page.
      </div>

      <div v-else class="cart-list">
        <div v-for="item in store.state.cart" :key="item.variant.id" class="cart-item">
          <div>
            <strong>{{ item.product.name }}</strong>
            <div class="meta">
              {{ item.variant.color?.name || item.variant.color }} · {{ item.variant.size }}
            </div>
            <div class="price">{{ store.formatCurrency(item.product.price) }}</div>
          </div>
          <div class="quantity">
            <button class="qty-btn" @click="store.updateQuantity(item.variant.id, -1)">-</button>
            <span>{{ item.quantity }}</span>
            <button class="qty-btn" @click="store.updateQuantity(item.variant.id, 1)">+</button>
          </div>
          <button class="link" @click="store.removeFromCart(item.variant.id)">Remove</button>
        </div>
      </div>

      <div class="notice">Subtotal: {{ store.formatCurrency(store.subtotal) }}</div>
    </div>

    <aside class="panel">
      <div class="section-title">
        <h2>Checkout</h2>
      </div>

      <form class="checkout" @submit.prevent="submitOrder">
        <div class="split">
          <input v-model="form.firstName" placeholder="First name" />
          <input v-model="form.lastName" placeholder="Last name" />
        </div>
        <input v-model="form.email" type="email" placeholder="Email" />
        <input v-model="form.phone" placeholder="Phone (optional)" />
        <input v-model="form.addressLine1" placeholder="Address" />
        <input v-model="form.addressLine2" placeholder="Address line 2 (optional)" />
        <div class="split">
          <input v-model="form.city" placeholder="City" />
          <input v-model="form.state" placeholder="State" />
        </div>
        <div class="split">
          <input v-model="form.postalCode" placeholder="Postal code" />
          <input v-model="form.country" placeholder="Country" />
        </div>
        <textarea v-model="notes" placeholder="Notes for your order"></textarea>

        <button class="btn btn-primary" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Sending...' : 'Place order' }}
        </button>

        <div v-if="orderNotice" class="notice">{{ orderNotice }}</div>
        <div v-if="orderError" class="notice error">{{ orderError }}</div>
      </form>
    </aside>
  </section>
</template>

<style scoped>
.meta {
  color: #8b8f97;
  font-size: 0.85rem;
}
</style>
