<script setup>
import { onMounted, ref } from 'vue'
import { einladungLesen, einladungErstellen, einladungWiderrufen, einladungsUrl, mitgliedEntfernen } from '../data/store'

const props = defineProps({ liste: { type: Object, required: true } })
const emit = defineEmits(['schliessen'])

const einladung = ref(null) // { token, gueltigBis } oder null
const kopiert = ref(false)
const fehler = ref('')

onMounted(async () => {
  try {
    einladung.value = await einladungLesen(props.liste.id)
  } catch (error) {
    console.log('error', error)
    fehler.value = 'Der Einladungslink konnte nicht geladen werden.'
  }
})

async function linkErstellen() {
  try {
    einladung.value = await einladungErstellen(props.liste.id)
    kopiert.value = false
  } catch (error) {
    console.log('error', error)
    fehler.value = 'Der Link konnte nicht erstellt werden.'
  }
}

async function linkKopieren() {
  await navigator.clipboard.writeText(einladungsUrl(einladung.value.token))
  kopiert.value = true
}

async function linkWiderrufen() {
  try {
    await einladungWiderrufen(props.liste.id)
    einladung.value = null
  } catch (error) {
    console.log('error', error)
    fehler.value = 'Der Link konnte nicht widerrufen werden.'
  }
}

async function entfernen(person) {
  if (!confirm(`${person} aus der Liste entfernen?`)) return
  try {
    await mitgliedEntfernen(props.liste.id, person)
  } catch (error) {
    console.log('error', error)
    fehler.value = 'Das Mitglied konnte nicht entfernt werden.'
  }
}

function datum(zeitpunkt) {
  return new Date(zeitpunkt).toLocaleDateString('de-DE')
}
</script>

<template>
  <div class="overlay" @click.self="emit('schliessen')">
    <div class="dialog">
      <h2>„{{ liste.name }}“ teilen</h2>

      <p class="gedimmt">
        Wer den Link öffnet und sich anmeldet, kann die Liste mitbearbeiten. Ein neuer Link macht den alten ungültig.
      </p>

      <template v-if="einladung">
        <input :value="einladungsUrl(einladung.token)" readonly @focus="$event.target.select()" />
        <small class="gedimmt">Gültig bis {{ datum(einladung.gueltigBis) }}</small>
        <div class="aktionen">
          <button class="primaer" @click="linkKopieren">{{ kopiert ? 'Kopiert ✓' : 'Link kopieren' }}</button>
          <button @click="linkErstellen">Neuer Link</button>
          <button class="gefahr" @click="linkWiderrufen">Widerrufen</button>
        </div>
      </template>
      <button v-else class="primaer" @click="linkErstellen">Einladungslink erstellen</button>

      <p v-if="fehler" class="gefahr-text">{{ fehler }}</p>

      <h3>Mitglieder</h3>
      <p v-if="!liste.mitglieder?.length" class="gedimmt">Noch niemand ist der Liste beigetreten.</p>
      <ul class="mitglieder">
        <li v-for="person in liste.mitglieder" :key="person">
          <span>{{ person }}</span>
          <button class="gefahr" @click="entfernen(person)">Entfernen</button>
        </li>
      </ul>

      <div class="aktionen">
        <button @click="emit('schliessen')">Schließen</button>
      </div>
    </div>
  </div>
</template>
