<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { listen, listeAnlegen, listeUmbenennen, listeLoeschen, leererFilter, filterAktiv, listenFiltern } from '../data/store'
import SuchLeiste from '../components/SuchLeiste.vue'

const neuerName = ref('')
const bearbeiteId = ref(null)
const bearbeiteName = ref('')

const filter = reactive(leererFilter())
const gefiltert = computed(() => listenFiltern(listen, filter))

async function anlegen() {
  if (!neuerName.value.trim()) return
  try {
    await listeAnlegen(neuerName.value.trim())
    neuerName.value = ''
  } catch (error) {
    console.log('error', error)
    alert('Die Liste konnte nicht gespeichert werden.')
  }
}

function umbenennenStarten(liste) {
  bearbeiteId.value = liste.id
  bearbeiteName.value = liste.name
}

async function umbenennenSpeichern() {
  try {
    if (bearbeiteName.value.trim()) await listeUmbenennen(bearbeiteId.value, bearbeiteName.value.trim())
    bearbeiteId.value = null
  } catch (error) {
    console.log('error', error)
    alert('Die Liste konnte nicht umbenannt werden.')
  }
}

async function loeschen(liste) {
  if (!confirm(`Liste „${liste.name}“ wirklich löschen?`)) return
  try {
    await listeLoeschen(liste.id)
  } catch (error) {
    console.log('error', error)
    alert('Die Liste konnte nicht gelöscht werden.')
  }
}
</script>

<template>
  <RouterLink to="/" class="zurueck">← Hauptmenü</RouterLink>
  <h1>Einkaufslisten</h1>

  <form class="zeile" @submit.prevent="anlegen">
    <input v-model="neuerName" placeholder="Name der neuen Liste" />
    <button type="submit" class="primaer">Anlegen</button>
  </form>

  <p v-if="listen.length === 0" class="gedimmt">Noch keine Einkaufslisten vorhanden.</p>
  <template v-else>
    <SuchLeiste v-model="filter" platzhalter="Listen und Produkte durchsuchen …" />
    <p v-if="gefiltert.length === 0" class="gedimmt">Keine Liste passt zu deiner Suche.</p>
  </template>

  <ul class="karten">
    <li v-for="{ liste, treffer } in gefiltert" :key="liste.id" class="karte">
      <form v-if="bearbeiteId === liste.id" class="zeile" @submit.prevent="umbenennenSpeichern">
        <input v-model="bearbeiteName" />
        <button type="submit" class="primaer">Speichern</button>
        <button type="button" @click="bearbeiteId = null">Abbrechen</button>
      </form>
      <template v-else>
        <RouterLink :to="`/listen/${liste.id}`" class="karte-titel">
          {{ liste.name }}
          <span class="gedimmt">{{ liste.produkte.length }} Produkte</span>
          <span v-if="filterAktiv(filter) && treffer.length" class="treffer">
            Treffer: {{ treffer.map((produkt) => produkt.name).join(', ') }}
          </span>
        </RouterLink>
        <div class="aktionen">
          <button @click="umbenennenStarten(liste)">Umbenennen</button>
          <button class="gefahr" @click="loeschen(liste)">Löschen</button>
        </div>
      </template>
    </li>
  </ul>
</template>
