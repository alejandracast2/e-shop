<template>
    <div v-if="!ageConfirmed" class="age-gate">
        <div class="inner">
            <div class="mark">LC</div>
            <h2>La Cantina</h2>
            <p>Para entrar a nuestra bodega, confirma que eres mayor de edad. La venta de bebidas alcohólicas a menores
                es prohibida (Ley 124 de 1994).</p>
            <div class="buttons">
                <button class="b-yes" @click="confirmAge">Sí, soy mayor</button>
                <a href="https://www.google.com" class="b-no">Salir</a>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref,onMounted } from 'vue'
const AGE_STORAGE_KEY = 'frontend-drink-age-confirmed'
const ageConfirmed = ref(false)

onMounted(() => {
    ageConfirmed.value = window.localStorage.getItem(AGE_STORAGE_KEY) === 'true'
})

function confirmAge() {
  ageConfirmed.value = true

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AGE_STORAGE_KEY, 'true')
  }
}
</script>
<style scoped>
.age-gate {
  position: fixed;
  inset: 0;
  background: var(--ink);
  color: var(--bone);
  z-index: 300;
  display: grid;
  place-items: center;
  opacity: 1;
  transition: .4s opacity;
}

.age-gate.off {
  opacity: 0;
  pointer-events: none
}

.age-gate .inner {
  max-width: 420px;
  text-align: center;
  padding: 48px 32px
}

.age-gate .mark {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  margin: 0 auto 24px;
  background: var(--wine);
  color: var(--bone);
  display: grid;
  place-items: center;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 700;
  font-size: 34px;
}

.age-gate h2 {
  font-family: 'Playfair Display', serif;
  font-size: 38px;
  margin: 0 0 14px;
  font-weight: 700;
  letter-spacing: -.015em
}

.age-gate p {
  color: rgba(250, 247, 242, .7);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 28px
}

.age-gate .buttons {
  display: flex;
  gap: 10px;
  justify-content: center
}

.age-gate .b-yes {
  background: var(--bone);
  color: var(--ink);
  padding: 14px 30px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: .18em;
  text-transform: uppercase;
  font-weight: 700
}

.age-gate .b-no {
  border: 1px solid rgba(250, 247, 242, .3);
  padding: 14px 26px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(250, 247, 242, .7)
}

.age-gate .b-yes:hover {
  background: var(--wine);
  color: var(--bone)
}
</style>