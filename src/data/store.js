import { reactive, ref, computed } from 'vue'
import axios from 'axios'

// Gemeinsamer Zustand aller Seiten. Die Listen kommen vom Backend, Änderungen leben aber nur im Browser (bis M4).
export const listen = reactive([])
export const ladestatus = ref('laden')

export async function listenLaden() {
  const baseUrl = import.meta.env.VITE_API_URL // 'http://localhost:8080' im Dev-Modus
  const endpoint = baseUrl + '/shoppinglists'
  ladestatus.value = 'laden'
  try {
    const response = await axios.get(endpoint)
    const responseData = response.data
    responseData.forEach((liste) => {
      listen.push(liste)
    })
    ladestatus.value = 'fertig'
  } catch (error) {
    console.log('error', error)
    ladestatus.value = 'fehler'
  }
}

let naechsteId = 1000

export function findeListe(id) {
  return listen.find((liste) => liste.id === Number(id))
}

export function listeAnlegen(name) {
  listen.push({ id: naechsteId++, name, produkte: [] })
}

export function listeUmbenennen(id, name) {
  findeListe(id).name = name
}

export function listeLoeschen(id) {
  const index = listen.findIndex((liste) => liste.id === id)
  listen.splice(index, 1)
}

export function produktHinzufuegen(listeId, produkt) {
  findeListe(listeId).produkte.push({ id: naechsteId++, erledigt: false, ...produkt })
}

export function produktLoeschen(listeId, produktId) {
  const liste = findeListe(listeId)
  liste.produkte = liste.produkte.filter((produkt) => produkt.id !== produktId)
}

// Alle Märkte, die in irgendeiner Liste schon vorkommen (später: Abfrage an die Datenbank)
export const bekannteMaerkte = computed(() => {
  const maerkte = listen.flatMap((liste) => liste.produkte.map((produkt) => produkt.markt))
  return [...new Set(maerkte.filter(Boolean))].sort((a, b) => a.localeCompare(b))
})

// Gleicht eine Eingabe mit den bekannten Märkten ab: "rewe" wird zu "Rewe"
export function marktAbgleichen(eingabe) {
  const name = eingabe.trim()
  const treffer = bekannteMaerkte.value.find((markt) => markt.toLowerCase() === name.toLowerCase())
  return treffer ?? name
}
