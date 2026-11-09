import { reactive, ref, computed } from 'vue'
import axios from 'axios'
import { accessToken, oktaAuth } from '../auth/okta'

// Gemeinsamer Zustand aller Seiten. Die Listen kommen vom Backend. Alle Änderungen an Listen und Produkten werden über das Backend in der Datenbank gespeichert.
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

// Lädt die Listen still im Hintergrund neu, z. B. um Änderungen anderer Mitglieder zu sehen
export async function listenAktualisieren() {
  const response = await axios.get(import.meta.env.VITE_API_URL + '/shoppinglists', mitToken())
  listen.splice(0, listen.length, ...response.data)
}

// Okta-Kennung der angemeldeten Person (wie "owner" und "mitglieder" im Backend)
export function meineKennung() {
  const token = accessToken()
  return token ? oktaAuth.token.decode(token).payload.sub : null
}

export function binBesitzer(liste) {
  return liste.owner === meineKennung()
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

export async function listeUmbenennen(id, name) {
  const response = await axios.put(`${import.meta.env.VITE_API_URL}/shoppinglists/${id}`, { name }, mitToken())
  findeListe(id).name = response.data.name
}

export async function listeLoeschen(id) {
  await axios.delete(`${import.meta.env.VITE_API_URL}/shoppinglists/${id}`, mitToken())
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

// Speichert Name, Menge, Markt und Notiz; der Erledigt-Status bleibt unverändert
export async function produktBearbeiten(listeId, produkt, geaendert) {
  const response = await axios.put(`${produkteEndpoint(listeId)}/${produkt.id}`, geaendert, mitToken())
  Object.assign(produkt, response.data)
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

// --- Teilen per Einladungslink ---

function listeEndpoint(listeId) {
  return `${import.meta.env.VITE_API_URL}/shoppinglists/${listeId}`
}

export function einladungsUrl(token) {
  return `${window.location.origin}/einladung/${token}`
}

// Aktueller Link der Liste oder null, falls es keinen gültigen gibt
export async function einladungLesen(listeId) {
  try {
    const response = await axios.get(`${listeEndpoint(listeId)}/einladung`, mitToken())
    return response.data
  } catch (error) {
    if (error.response?.status === 404) return null
    throw error
  }
}

export async function einladungErstellen(listeId) {
  const response = await axios.post(`${listeEndpoint(listeId)}/einladung`, null, mitToken())
  return response.data
}

export async function einladungWiderrufen(listeId) {
  await axios.delete(`${listeEndpoint(listeId)}/einladung`, mitToken())
}

export async function einladungAnsehen(token) {
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/einladungen/${token}`, mitToken())
  return response.data
}

export async function einladungAnnehmen(token) {
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/einladungen/${token}/annehmen`, null, mitToken())
  const liste = response.data
  const index = listen.findIndex((l) => l.id === liste.id)
  if (index === -1) listen.push(liste)
  else listen.splice(index, 1, liste)
  return liste
}

// Besitzer entfernt ein Mitglied, oder ein Mitglied verlässt die Liste (person = eigene Kennung)
export async function mitgliedEntfernen(listeId, person) {
  await axios.delete(`${listeEndpoint(listeId)}/mitglieder/${encodeURIComponent(person)}`, mitToken())
  if (person === meineKennung()) {
    const index = listen.findIndex((liste) => liste.id === listeId)
    if (index !== -1) listen.splice(index, 1)
  } else {
    const liste = findeListe(listeId)
    liste.mitglieder = liste.mitglieder.filter((mitglied) => mitglied !== person)
  }
}
