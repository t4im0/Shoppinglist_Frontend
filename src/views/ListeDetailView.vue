<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findeListe, produktHinzufuegen, produktErledigtSetzen, produktLoeschen, leererFilter, produktPasst } from '../data/store'
import ProduktDialog from '../components/ProduktDialog.vue'
import SuchLeiste from '../components/SuchLeiste.vue'

const route = useRoute()
const liste = computed(() => findeListe(route.params.id))
const dialogOffen = ref(false)

const filter = reactive(leererFilter())
const gefilterteProdukte = computed(() => (liste.value?.produkte ?? []).filter((produkt) => produktPasst(produkt, filter)))

async function hinzufuegen(produkt) {
  try {
    await produktHinzufuegen(liste.value.id, produkt)
    dialogOffen.value = false
  } catch (error) {
    console.log('error', error)
    alert('Das Produkt konnte nicht gespeichert werden.')
  }
}

async function erledigtSetzen(produkt, erledigt) {
  try {
    await produktErledigtSetzen(liste.value.id, produkt, erledigt)
  } catch (error) {
    console.log('error', error)
    alert('Der Status konnte nicht gespeichert werden.')
  }
}

async function loeschen(produkt) {
  try {
    await produktLoeschen(liste.value.id, produkt.id)
  } catch (error) {
    console.log('error', error)
    alert('Das Produkt konnte nicht gelöscht werden.')
  }
}
</script>

<template>
  <RouterLink to="/listen" class="zurueck">← Einkaufslisten</RouterLink>

  <p v-if="!liste">Diese Liste gibt es nicht.</p>
  <template v-else>
    <div class="titelzeile">
      <h1>{{ liste.name }}</h1>
      <button class="primaer" @click="dialogOffen = true">+ Produkt</button>
    </div>

    <p v-if="liste.produkte.length === 0" class="gedimmt">Noch keine Produkte in dieser Liste.</p>
    <template v-else>
      <SuchLeiste v-model="filter" platzhalter="Produkte durchsuchen …" />
      <p v-if="gefilterteProdukte.length === 0" class="gedimmt">Kein Produkt passt zu deiner Suche.</p>
    </template>

    <ul class="karten">
      <li v-for="produkt in gefilterteProdukte" :key="produkt.id" class="karte produkt" :class="{ erledigt: produkt.erledigt }">
        <input :checked="produkt.erledigt" type="checkbox" @change="erledigtSetzen(produkt, $event.target.checked)" />
        <div class="produkt-text">
          <strong>{{ produkt.menge }} × {{ produkt.name }}</strong>
          <span v-if="produkt.markt" class="markt-chip">{{ produkt.markt }}</span>
          <div v-if="produkt.notiz" class="gedimmt">{{ produkt.notiz }}</div>
        </div>
        <button class="gefahr" title="Produkt löschen" @click="loeschen(produkt)">✕</button>
      </li>
    </ul>

    <ProduktDialog v-if="dialogOffen" @hinzufuegen="hinzufuegen" @verwerfen="dialogOffen = false" />
  </template>
</template>
