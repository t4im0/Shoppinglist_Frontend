<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  findeListe, produktHinzufuegen, produktErledigtSetzen, produktLoeschen, leererFilter, produktPasst,
  binBesitzer, meineKennung, mitgliedEntfernen, listenAktualisieren,
} from '../data/store'
import ProduktDialog from '../components/ProduktDialog.vue'
import TeilenDialog from '../components/TeilenDialog.vue'
import SuchLeiste from '../components/SuchLeiste.vue'

const route = useRoute()
const liste = computed(() => findeListe(route.params.id))
const router = useRouter()
const dialogOffen = ref(false)
const teilenOffen = ref(false)

const besitzer = computed(() => liste.value && binBesitzer(liste.value))
const geteilt = computed(() => liste.value && (!besitzer.value || liste.value.mitglieder.length > 0))

// Geteilte Listen alle 10 Sekunden neu laden, damit Änderungen der anderen erscheinen
let timer
onMounted(() => {
  timer = setInterval(() => {
    if (geteilt.value && !dialogOffen.value) listenAktualisieren().catch((error) => console.log('error', error))
  }, 10000)
})
onUnmounted(() => clearInterval(timer))

async function verlassen() {
  if (!confirm(`Liste „${liste.value.name}“ verlassen?`)) return
  try {
    await mitgliedEntfernen(liste.value.id, meineKennung())
    router.push('/listen')
  } catch (error) {
    console.log('error', error)
    alert('Die Liste konnte nicht verlassen werden.')
  }
}

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
      <div class="aktionen">
        <button v-if="besitzer" @click="teilenOffen = true">Teilen</button>
        <button v-else @click="verlassen">Verlassen</button>
        <button class="primaer" @click="dialogOffen = true">+ Produkt</button>
      </div>
    </div>
    <p v-if="!besitzer" class="geteilt">Geteilt von {{ liste.owner }}</p>
    <p v-else-if="liste.mitglieder.length" class="geteilt">Geteilt mit {{ liste.mitglieder.join(', ') }}</p>

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
    <TeilenDialog v-if="teilenOffen" :liste="liste" @schliessen="teilenOffen = false" />
  </template>
</template>
