/**
 * Kuratiertes Changelog für die „Was ist neu"-Anzeige (Glocke in der Topbar).
 *
 * BEWUSST in Kundensprache, NICHT roh aus Git. Pro Update ein Eintrag mit
 * verständlichen Punkten — keine technischen Commit-Messages oder Dateinamen.
 *
 * Pflege: Bei jedem Release oben einen neuen Eintrag ergänzen. `id` muss
 * eindeutig + monoton steigend sein (z.B. Datum) — daran erkennt die Glocke,
 * ob es etwas Neues seit dem letzten Besuch gibt.
 */

export interface ChangelogEntry {
  /** Eindeutige, monoton steigende Kennung (z.B. ISO-Datum). */
  id: string
  /** Versions-/Anzeigename, z.B. "Update 28.06.2026". */
  title: string
  /** Anzeige-Datum. */
  date: string
  /** Verständliche Punkte in Kundensprache. */
  changes: { type: 'new' | 'improved' | 'fixed'; text: string }[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-07-02',
    title: 'Update 02.07.2026',
    date: '02.07.2026',
    changes: [
      { type: 'new', text: 'Ihre Kundinnen und Kunden können jetzt online direkt eine Station auswählen und ein Fahrzeug für einen Zeitraum unverbindlich anfragen — mit Richtpreis-Anzeige, ganz ohne Anruf.' },
      { type: 'new', text: 'Neue Übersicht „Online-Anfragen" im Dashboard: eingegangene Anfragen sehen Sie sofort mit Kontaktdaten und können sie mit einem Klick bestätigen (dabei Preis und Details ergänzen) oder ablehnen.' },
      { type: 'improved', text: 'Bei der Online-Anfrage werden nur Fahrzeuge angezeigt, die an der gewählten Station stehen und im Zeitraum frei sind — inklusive Mindestvorlauf, damit genug Zeit zur Vorbereitung bleibt.' },
    ],
  },
  {
    id: '2026-06-30',
    title: 'Update 30.06.2026',
    date: '30.06.2026',
    changes: [
      { type: 'improved', text: 'Buchungen lassen sich jetzt direkt vom Dashboard aus öffnen — ein Klick auf eine Buchung führt sofort zu Details und Vertragsdaten, ohne Umweg über die Buchungsliste.' },
      { type: 'improved', text: 'Sicherheitsabfragen vor dem Löschen erscheinen jetzt als gestaltetes Fenster im Design der App statt als schlichtes Browser-Pop-up — einheitlich auf allen Seiten.' },
      { type: 'improved', text: 'Das echte NuVio-Logo erscheint jetzt überall: auf der Anmeldeseite, in der Seitenleiste sowie beim Installieren und auf dem Startbildschirm.' },
    ],
  },
  {
    id: '2026-06-29',
    title: 'Update 29.06.2026',
    date: '29.06.2026',
    changes: [
      { type: 'improved', text: 'Zurückgenommene Fahrzeuge werden im Kalender jetzt grün als „Abgeschlossen" angezeigt — nicht mehr rot als überfällig.' },
      { type: 'improved', text: 'Auch Bearbeiter können Fahrzeugrückgaben eintragen; das Fahrzeug zählt danach sofort wieder als verfügbar.' },
      { type: 'fixed', text: 'Die Detail-Vorschau im Kalender (beim Überfahren einer Buchung) hat jetzt wieder einen deckenden Hintergrund.' },
      { type: 'improved', text: 'Kalender-Legende und Statusfilter um „Abgeschlossen" ergänzt.' },
    ],
  },
  {
    id: '2026-06-28',
    title: 'Update 28.06.2026',
    date: '28.06.2026',
    changes: [
      { type: 'new', text: 'Mietvertrag direkt aus einer Buchung erstellen — geführter Ablauf für Kundendaten und Schadensprotokoll, zum Abschreiben oder Drucken.' },
      { type: 'new', text: 'Schäden lassen sich auf einem Fahrzeug-Schaubild markieren (Lack-/Karosserieschäden) und optional fotografieren.' },
      { type: 'improved', text: 'Bei der Buchung sind bereits belegte Fahrzeuge zum gewählten Zeitpunkt rot und nicht mehr auswählbar — keine Doppelbuchungen mehr.' },
      { type: 'improved', text: 'Jede Buchung zeigt jetzt, wer sie angelegt und wer sie zuletzt bearbeitet hat (mit Datum).' },
      { type: 'new', text: 'Diese „Was ist neu"-Übersicht: Hier siehst du als Administrator künftig, was sich mit jedem Update ändert.' },
    ],
  },
  {
    id: '2026-06-27',
    title: 'Update 27.06.2026',
    date: '27.06.2026',
    changes: [
      { type: 'new', text: 'Fahrzeugrückgabe direkt im Dashboard bestätigen — überfällige Rückgaben verschwinden, sobald das Fahrzeug zurück ist.' },
      { type: 'improved', text: 'Kennzeichen werden einheitlich gespeichert (Großbuchstaben mit Bindestrichen).' },
      { type: 'fixed', text: 'Anhänger-Preise vollständig hinterlegt — jedes Fahrzeug zeigt jetzt einen Preis.' },
    ],
  },
]
