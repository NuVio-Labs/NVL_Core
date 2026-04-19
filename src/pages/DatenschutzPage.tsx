export function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto prose prose-sm">

        <h1 className="text-2xl font-bold mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-muted-foreground mb-8">Stand: 19. April 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">1. Verantwortlicher</h2>
          <p className="text-sm text-foreground leading-relaxed">
            Verantwortlich für die Verarbeitung Ihrer personenbezogenen Daten ist das Unternehmen,
            das Ihnen die Miete oder Buchung anbietet (nachfolgend „Vermieter"). Der Vermieter nutzt
            zur Abwicklung die Software-Plattform NuVio, die von NuVioLabs bereitgestellt wird.
          </p>
          <p className="text-sm text-foreground leading-relaxed mt-2">
            NuVioLabs ist dabei technischer Dienstleister (Auftragsverarbeiter) und verarbeitet Ihre
            Daten ausschließlich im Auftrag und nach Weisung des Vermieters.
          </p>
          <p className="text-sm text-foreground leading-relaxed mt-2">
            <strong>NuVioLabs</strong><br />
            Axel Schurer<br />
            Nimwegerstraße 3, 47559 Kranenburg<br />
            contact@nuviolabs.de
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">2. Welche Daten werden verarbeitet?</h2>

          <h3 className="text-base font-medium mb-2">2.1 Vertragsabschluss</h3>
          <p className="text-sm text-foreground leading-relaxed mb-2">
            Zur Erstellung eines Mietvertrags verarbeiten wir folgende Daten:
          </p>
          <ul className="text-sm text-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>Vorname, Nachname</li>
            <li>Adresse (Straße, PLZ, Ort)</li>
            <li>Geburtsdatum</li>
            <li>Telefonnummer (optional)</li>
            <li>E-Mail-Adresse (optional)</li>
            <li>Führerscheinklasse und Führerscheinnummer</li>
            <li>Reisepassnummer (wenn kein Führerschein vorhanden)</li>
            <li>Zahlungsart und Zahlungsstatus</li>
            <li>Vertragsdetails (Fahrzeug, Zeitraum, Preis, Extras)</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <strong>Nicht gespeichert wird:</strong> Die Seriennummer des Personalausweises (oben rechts
            auf dem Ausweis). Die Speicherung ist nach § 20 Abs. 2 Personalausweisgesetz (PAuswG) verboten.
          </p>

          <h3 className="text-base font-medium mb-2 mt-6">2.2 Optionaler Dokumentenscan (OCR)</h3>
          <p className="text-sm text-foreground leading-relaxed">
            Falls Ihr Vermieter die OCR-Funktion anbietet und Sie dieser zustimmen, kann das Personal
            Ihren Ausweis oder Führerschein fotografieren, um die Dateneingabe zu beschleunigen.
          </p>
          <ul className="text-sm text-foreground leading-relaxed list-disc pl-5 space-y-1 mt-2">
            <li>Das Foto wird an einen KI-Dienst (OpenAI, verarbeitet in der EU) übermittelt</li>
            <li>Der KI-Dienst extrahiert die relevanten Textfelder</li>
            <li>Das Foto wird <strong>sofort nach der Extraktion gelöscht</strong> — es wird nirgendwo dauerhaft gespeichert</li>
            <li>Das Personal prüft und korrigiert die extrahierten Daten vor dem Speichern</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Diese Funktion ist <strong>freiwillig</strong>. Sie können den Vertrag auch ohne Dokumentenscan abschließen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">3. Rechtsgrundlagen</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-md">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Verarbeitung</th>
                  <th className="text-left px-3 py-2 font-medium">Rechtsgrundlage</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Vertragsfelder (Name, Adresse, etc.)', 'Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung'],
                  ['Aufbewahrung nach Vertragsende', 'Art. 6 Abs. 1 lit. c DSGVO — gesetzliche Pflicht (HGB, AO)'],
                  ['Dokumentenscan (OCR)', 'Art. 6 Abs. 1 lit. a DSGVO — Ihre ausdrückliche Einwilligung'],
                ].map(([v, r]) => (
                  <tr key={v} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{v}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">4. Speicherdauer</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-md">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Datenkategorie</th>
                  <th className="text-left px-3 py-2 font-medium">Frist</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Mietvertragsdaten', '6 Jahre nach Vertragsende (§ 257 HGB)'],
                  ['Steuerrelevante Verträge', '10 Jahre nach Vertragsende (§ 147 AO)'],
                  ['Ausweisfotos (OCR)', 'Sofortige Löschung nach Datenextraktion'],
                  ['Einwilligungsnachweis (OCR)', 'Gleiche Frist wie Vertragsdaten'],
                ].map(([d, f]) => (
                  <tr key={d} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{d}</td>
                    <td className="px-3 py-2 text-muted-foreground">{f}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">5. Empfänger Ihrer Daten</h2>
          <p className="text-sm text-foreground leading-relaxed mb-3">
            Ihre Daten werden grundsätzlich nicht an Dritte weitergegeben. Technische Dienstleister
            (Auftragsverarbeiter) verarbeiten Daten ausschließlich nach unserer Weisung:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-md">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Dienstleister</th>
                  <th className="text-left px-3 py-2 font-medium">Zweck</th>
                  <th className="text-left px-3 py-2 font-medium">Sitz</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Supabase Inc.', 'Datenbankhosting', 'USA (SCCs)'],
                  ['Vercel Inc.', 'Anwendungshosting', 'USA (SCCs)'],
                  ['OpenAI Ireland Ltd.', 'OCR-Texterkennung (nur bei Einwilligung)', 'Irland (EEA)'],
                ].map(([d, z, s]) => (
                  <tr key={d} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{d}</td>
                    <td className="px-3 py-2 text-muted-foreground">{z}</td>
                    <td className="px-3 py-2 text-muted-foreground">{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Die Übermittlung in die USA erfolgt auf Basis von Standardvertragsklauseln (SCCs) gemäß Art. 46 DSGVO.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">6. Ihre Rechte</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-md">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Recht</th>
                  <th className="text-left px-3 py-2 font-medium">Inhalt</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Auskunft (Art. 15)', 'Auskunft über die zu Ihrer Person gespeicherten Daten'],
                  ['Berichtigung (Art. 16)', 'Berichtigung unrichtiger Daten'],
                  ['Löschung (Art. 17)', 'Löschung, soweit keine gesetzliche Aufbewahrungspflicht besteht'],
                  ['Einschränkung (Art. 18)', 'Einschränkung der Verarbeitung'],
                  ['Widerspruch (Art. 21)', 'Widerspruch gegen die Verarbeitung'],
                  ['Datenübertragbarkeit (Art. 20)', 'Ihre Daten in maschinenlesbarem Format'],
                  ['Widerruf der Einwilligung (Art. 7 Abs. 3)', 'Jederzeit widerrufbar — ohne Auswirkung auf bisherige Verarbeitung'],
                ].map(([r, i]) => (
                  <tr key={r} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground font-medium whitespace-nowrap">{r}</td>
                    <td className="px-3 py-2 text-muted-foreground">{i}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Zur Ausübung Ihrer Rechte wenden Sie sich an den Vermieter oder an:{' '}
            <a href="mailto:contact@nuviolabs.de" className="text-primary underline">contact@nuviolabs.de</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">7. Beschwerderecht</h2>
          <p className="text-sm text-foreground leading-relaxed">
            Sie haben das Recht, sich bei der zuständigen Datenschutz-Aufsichtsbehörde zu beschweren:
          </p>
          <p className="text-sm text-foreground leading-relaxed mt-2">
            <strong>Landesbeauftragte für Datenschutz und Informationsfreiheit NRW (LDI NRW)</strong><br />
            Kavalleriestraße 2–4, 40213 Düsseldorf<br />
            <a href="mailto:poststelle@ldi.nrw.de" className="text-primary underline">poststelle@ldi.nrw.de</a><br />
            Tel.: 0211 38424-0
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">8. Hinweis zum Personalausweis</h2>
          <p className="text-sm text-foreground leading-relaxed">
            Das Ablichten eines Personalausweises ist nur mit Ihrer ausdrücklichen Einwilligung zulässig (PAuswG).
            Sie können die Zustimmung verweigern — der Vertragsabschluss ist auch ohne Dokumentenscan möglich.
          </p>
          <p className="text-sm text-foreground leading-relaxed mt-2">
            Die Seriennummer des Personalausweises (oben rechts auf dem Ausweis, z.B. „L01X00T47") wird
            technisch gefiltert und niemals gespeichert. Dies ist gesetzlich durch § 20 Abs. 2 PAuswG verboten.
          </p>
        </section>

        <p className="text-xs text-muted-foreground border-t border-border pt-6 mt-8">
          Stand: 19. April 2026 · NuVioLabs · contact@nuviolabs.de
        </p>

      </div>
    </div>
  )
}
