<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ladestatus, listenLaden } from './data/store'

listenLaden()
</script>

<template>
  <header class="kopfzeile">
    <RouterLink to="/" class="logo">🛒 Einkaufsliste</RouterLink>
  </header>
  <main class="inhalt">
    <p v-if="ladestatus === 'laden'" class="gedimmt">Listen werden geladen. Das kann beim ersten Aufruf bis zu einer Minute dauern.</p>
    <template v-else-if="ladestatus === 'fehler'">
      <p>Die Listen konnten nicht geladen werden.</p>
      <button @click="listenLaden">Erneut versuchen</button>
    </template>
    <RouterView v-else />
  </main>
</template>
