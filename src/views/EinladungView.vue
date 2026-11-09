<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { einladungAnsehen, einladungAnnehmen } from '../data/store'

const route = useRoute()
const router = useRouter()
const info = ref(null) // { listeId, listeName, owner, bereitsMitglied }
const fehler = ref('')

onMounted(async () => {
  try {
    info.value = await einladungAnsehen(route.params.token)
  } catch (error) {
    console.log('error', error)
    fehler.value = 'Diese Einladung ist ungültig oder abgelaufen.'
  }
})

async function beitreten() {
  try {
    const liste = await einladungAnnehmen(route.params.token)
    router.push(`/listen/${liste.id}`)
  } catch (error) {
    console.log('error', error)
    fehler.value = 'Beitreten hat nicht geklappt. Vielleicht wurde der Link gerade widerrufen.'
  }
}
</script>

<template>
  <RouterLink to="/listen" class="zurueck">← Einkaufslisten</RouterLink>
  <h1>Einladung</h1>

  <p v-if="fehler">{{ fehler }}</p>
  <p v-else-if="!info" class="gedimmt">Einladung wird geladen …</p>
  <div v-else class="karte einladung">
    <p><strong>{{ info.owner }}</strong> lädt dich zur Liste <strong>„{{ info.listeName }}“</strong> ein.</p>
    <RouterLink v-if="info.bereitsMitglied" :to="`/listen/${info.listeId}`" class="button-link">Zur Liste</RouterLink>
    <button v-else class="primaer" @click="beitreten">Beitreten</button>
  </div>
</template>
