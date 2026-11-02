<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { oktaAuth } from '../auth/okta'

const router = useRouter()
const fehler = ref('')

// Okta leitet nach dem Login hierher zurück. Wir tauschen den Code gegen Tokens
// und gehen dann zur Seite, die vor dem Login aufgerufen wurde.
onMounted(async () => {
  try {
    await oktaAuth.handleLoginRedirect(undefined, (_oktaAuth, originalUri) => {
      router.replace(originalUri || '/listen')
    })
  } catch (error) {
    console.log('error', error)
    fehler.value = error.message
  }
})
</script>

<template>
  <p v-if="fehler">Anmeldung fehlgeschlagen: {{ fehler }}</p>
  <p v-else class="gedimmt">Anmeldung wird abgeschlossen …</p>
</template>
