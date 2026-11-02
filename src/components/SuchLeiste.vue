<script setup>
import { bekannteMaerkte, filterAktiv, leererFilter } from '../data/store'

defineProps({ platzhalter: { type: String, default: 'Suchen …' } })

// Der Filter wird mit v-model von der Seite übergeben: { suche, markt, status }
const filter = defineModel({ type: Object, required: true })

function zuruecksetzen() {
  Object.assign(filter.value, leererFilter())
}
</script>

<template>
  <div class="suchleiste">
    <input v-model="filter.suche" type="search" :placeholder="platzhalter" aria-label="Suche" />
    <div class="filter">
      <select v-model="filter.markt" aria-label="Markt">
        <option value="">Alle Märkte</option>
        <option v-for="markt in bekannteMaerkte" :key="markt" :value="markt">{{ markt }}</option>
      </select>
      <select v-model="filter.status" aria-label="Status">
        <option value="alle">Alle Produkte</option>
        <option value="offen">Nur offene</option>
        <option value="erledigt">Nur erledigte</option>
      </select>
      <button v-if="filterAktiv(filter)" type="button" @click="zuruecksetzen">Zurücksetzen</button>
    </div>
  </div>
</template>
