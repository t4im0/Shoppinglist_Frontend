<script setup>
import { watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { ladestatus, listenLaden, listenLeeren } from './data/store'
import { angemeldet, benutzer, abmelden } from './auth/okta'

// Listen erst laden, wenn jemand angemeldet ist (das Backend verlangt ein Token)
watch(
  angemeldet,
  (istAngemeldet) => {
    if (istAngemeldet) listenLaden()
    else listenLeeren()
  },
  { immediate: true },
)
</script>

<template>
  <header class="kopfzeile">
    <RouterLink to="/" class="logo">🛒 Einkaufsliste</RouterLink>
    <div v-if="angemeldet" class="konto">
      <span class="gedimmt">{{ benutzer?.email }}</span>
      <button @click="abmelden">Abmelden</button>
    </div>
  </header>
  <main class="inhalt">
    <template v-if="angemeldet && ladestatus === 'laden'">
      <p class="gedimmt">Listen werden geladen. Das kann beim ersten Aufruf bis zu einer Minute dauern.</p>
    </template>
    <template v-else-if="angemeldet && ladestatus === 'fehler'">
      <p>Die Listen konnten nicht geladen werden.</p>
      <button @click="listenLaden">Erneut versuchen</button>
    </template>
    <RouterView v-else />
  </main>
</template>
