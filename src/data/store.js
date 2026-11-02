import { reactive, ref, computed } from 'vue'
import axios from 'axios'
import { accessToken } from '../auth/okta'

// Gemeinsamer Zustand aller Seiten. Die Listen kommen vom Backend. Neue Listen und Produkte werden in der Datenbank gespeichert. Umbenennen und Löschen von Listen leben noch im Browser.
export const listen = reactive([])
export const ladestatus = ref('laden')

export async function listenLaden() {
  const baseUrl = import.meta.env.VITE_API_URL // 'http://localhost:8080' im Dev-Modus
  const endpoint = baseUrl + '/shoppinglists'
  ladestatus.value = 'laden'
  try {
    // Das Backend gibt nur mit gültigem Okta-Token die Listen der angemeldeten Person heraus
    const response = await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${accessToken()}` },
    })
    const responseData = response.data
    listen.length = 0
    responseData.forEach((liste) => {
      listen.push(liste)
    })
    ladestatus.value = 'fertig'
  } catch (error) {
    console.log('error', error)
    ladestatus.value = 'fehler'
  }
}

// Beim Abmelden: Listen der vorherigen Person aus dem Browser entfernen
export function listenLeeren() {
  listen.length = 0
  ladestatus.value = 'laden'
}

export function findeListe(id) {
  return listen.find((liste) => liste.id === Number(id))
}

// Speichert eine neue Liste per POST in der Datenbank und übernimmt die Antwort (mit der vergebenen id)
export async function listeAnlegen(name) {
  const endpoint = import.meta.env.VITE_API_URL + '/shoppinglists'
  const response = await axios.post(endpoint, { name }, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  })
  listen.push(response.data)
}

export function listeUmbenennen(id, name) {
  findeListe(id).name = name
}

export function listeLoeschen(id) {
  const index = listen.findIndex((liste) => liste.id === id)
  listen.splice(index, 1)
}

// Produkte werden in der Datenbank gespeichert, die Antwort des Backends enthält die vergebene id
function produkteEndpoint(listeId) {
  return `${import.meta.env.VITE_API_URL}/shoppinglists/${listeId}/produkte`
}

function mitToken() {
  return { headers: { Authorization: `Bearer ${accessToken()}` } }
}

export async function produktHinzufuegen(listeId, produkt) {
  const response = await axios.post(produkteEndpoint(listeId), produkt, mitToken())
  findeListe(listeId).produkte.push(response.data)
}

export async function produktErledigtSetzen(listeId, produkt, erledigt) {
  produkt.erledigt = erledigt // sofort anzeigen, bei einem Fehler zurücksetzen
  try {
    await axios.patch(`${produkteEndpoint(listeId)}/${produkt.id}`, { erledigt }, mitToken())
  } catch (error) {
    produkt.erledigt = !erledigt
    throw error
  }
}

export async function produktLoeschen(listeId, produktId) {
  await axios.delete(`${produkteEndpoint(listeId)}/${produktId}`, mitToken())
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

// Startwerte für Suchleiste und Filter
export function leererFilter() {
  return { suche: '', markt: '', status: 'alle' }
}

export function filterAktiv(filter) {
  return filter.suche.trim() !== '' || filter.markt !== '' || filter.status !== 'alle'
}

function enthaelt(text, suche) {
  return (text ?? '').toLowerCase().includes(suche.trim().toLowerCase())
}

// Prüft, ob ein Produkt zu Suchbegriff, Markt und Status passt
export function produktPasst(produkt, filter, sucheIgnorieren = false) {
  const suchePasst =
    sucheIgnorieren || [produkt.name, produkt.notiz, produkt.markt].some((text) => enthaelt(text, filter.suche))
  const marktPasst = !filter.markt || produkt.markt === filter.markt
  const statusPasst =
    filter.status === 'alle' || (filter.status === 'erledigt' ? produkt.erledigt : !produkt.erledigt)
  return suchePasst && marktPasst && statusPasst
}

// Liefert alle Listen, die zum Filter passen, jeweils mit den passenden Produkten als Treffer
export function listenFiltern(alleListen, filter) {
  return alleListen
    .map((liste) => {
      const nameTrifft = enthaelt(liste.name, filter.suche)
      // Trifft der Listenname, zählen alle Produkte (nur Markt und Status filtern noch)
      const treffer = liste.produkte.filter((produkt) => produktPasst(produkt, filter, nameTrifft))
      const nurSuche = !filter.markt && filter.status === 'alle'
      const sichtbar = treffer.length > 0 || (nameTrifft && nurSuche)
      return { liste, treffer, sichtbar }
    })
    .filter((eintrag) => eintrag.sichtbar)
}
