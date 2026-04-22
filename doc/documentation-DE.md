# Projekt TTRPG Helper (DE)

von Leonhardit07 and GrumpyPants

## Einleitung

Der TTRPG Helper ist ein browserbasiertes Tool zum Anlegen und Verwalten von Abenteuern sowie zugehöriger Non-Player-Characters (NPCs) für Tabletop RPGs. Zur Erstellung und Überarbeitung kann das integrierte LLM herangezogen werden.
Das Projekt entsteht im Rahmen des Wahlpflichtfachmoduls "LLM gestützte Softwareentwicklung" an der Hochschule Esslingen. Ziel des Kurses und somit dieses Projekts ist die Verwendung KI-gestützter Tools für die Planung und Entwicklung einer Software sowie die Beurteilung und Einschätzung der Effektivität solcher Tools.

## Zielgruppe

Der TTRPG Helper richtet sich primär an Spielleiter von TTRPGs, die Abenteuer auf eine strukturierte Art anlegen und ihnen NPCs zuweisen möchten.

## EPICs und User Stories

Die User Stories wurden in Epics gegliedert und mit Akzeptanzkriterien versehen.

### EPIC 1: Abenteuer erstellen & verwalten

#### US-1: Abenteuer manuell erstellen (MVP)

Als Spielleiter möchte ich ein neues Abenteuer erstellen können, damit ich meine eigene Geschichte strukturieren kann.

**Akzeptanzkriterien:**

- Nutzer kann ein neues Abenteuer anlegen
- Abenteuer enthält mindestens:
  - Beschreibung
  - Zusammenfassung

- Felder können initial leer sein
- Abenteuer wird im System gespeichert (temporär)

#### US-2: Abenteuer mit KI generieren

Als Spielleiter möchte ich ein Abenteuer durch KI generieren lassen, damit ich schnell eine Grundlage habe.

**Akzeptanzkriterien:**

- Nutzer kann einen Prompt eingeben
- System generiert:
  - Beschreibung
  - Zusammenfassung

- Generierter Inhalt wird automatisch in ein neues Abenteuer übernommen
- Nutzer kann Ergebnis übernehmen oder verwerfen

**Notes:**

- Prompt sollte optional sein (Default möglich)

#### US-3: Abenteuer mit KI bearbeiten

Als Spielleiter möchte ich ein bestehendes Abenteuer mit KI anpassen, damit ich Inhalte schnell erweitern oder verbessern kann.

**Akzeptanzkriterien:**

- Nutzer kann bestehende Beschreibung auswählen
- Nutzer kann Änderungswunsch eingeben
- KI liefert überarbeitete Version
- Nutzer kann:
  - Änderung übernehmen
  - oder verwerfen

#### US-4: Abenteuer als JSON exportieren (MVP)

Als Spielleiter möchte ich mein Abenteuer als JSON-Datei speichern, damit ich es lokal sichern und weiterverwenden kann.

**Akzeptanzkriterien:**

- Nutzer kann Speicherort auswählen
- Datei wird im JSON-Format gespeichert
- Datei enthält alle relevanten Daten:
  - Beschreibung
  - Zusammenfassung
  - NPCs
  - Story-Struktur

### EPIC 2: Story-Verzweigungen

#### US-5: Story-Knoten hinzufügen (MVP)

Als Spielleiter möchte ich meinem Abenteuer mehrere Story-Abschnitte hinzufügen, damit ich die Handlung strukturieren kann.

**Akzeptanzkriterien:**

- Nutzer kann neue Story-Knoten erstellen
- Jeder Knoten enthält:
  - Text / Beschreibung

- Knoten werden dem Abenteuer zugeordnet

#### US-6: Verzweigungen zwischen Knoten definieren (MVP)

Als Spielleiter möchte ich Entscheidungen zwischen Story-Knoten definieren, damit Spieler unterschiedliche Wege gehen können.

**Akzeptanzkriterien:**

- Nutzer kann einem Knoten mehrere Auswahlmöglichkeiten hinzufügen
- Jede Auswahl verweist auf einen Ziel-Knoten
- Verweise sind valide (kein Broken Link)

### EPIC 3: NPC-Verwaltung

#### US-7: NPC manuell erstellen (MVP)

Als Spielleiter möchte ich NPCs erstellen können, damit ich mein Abenteuer mit Charakteren füllen kann.

**Akzeptanzkriterien:**

- Nutzer kann NPC erstellen mit:
  - Beschreibung
  - NPC-Story
  - Zusammenfassung

- Felder sind editierbar

#### US-8: NPC automatisch generieren

Als Spielleiter möchte ich NPCs passend zu einem Abenteuer generieren lassen, damit sie thematisch zur Geschichte passen.

**Akzeptanzkriterien:**

- Nutzer wählt ein Abenteuer aus
- KI generiert NPC basierend auf Abenteuerinhalt
- Ergebnis enthält:
  - Beschreibung
  - Hintergrundgeschichte
  - Zusammenfassung

- Nutzer kann NPC übernehmen oder verwerfen

#### US-9: NPC einem Abenteuer zuweisen (MVP)

Als Spielleiter möchte ich NPCs einem Abenteuer zuordnen, damit ich alle relevanten Charaktere zentral verwalten kann.

**Akzeptanzkriterien:**

- Nutzer kann NPC auswählen
- NPC wird dem Abenteuer hinzugefügt
- Mehrere NPCs pro Abenteuer möglich

### EPIC 4: Zusammenfassungen

#### US-10: Zusammenfassung bearbeiten (MVP)

Als Spielleiter möchte ich die Zusammenfassung eines Abenteuers oder NPCs bearbeiten, damit ich schnell einen Überblick habe.

**Akzeptanzkriterien:**

- Zusammenfassung ist editierbar
- Änderungen werden gespeichert

#### US-11: Zusammenfassung per KI generieren

Als Spielleiter möchte ich automatisch eine Zusammenfassung generieren lassen, damit ich Zeit spare.

**Akzeptanzkriterien:**

- KI generiert kurze Zusammenfassung basierend auf Inhalt
- Nutzer kann Ergebnis übernehmen oder verwerfen

### EPIC 5: Basis-Systemverhalten

#### US-12: Abenteuer laden (MVP)

Als Spielleiter möchte ich ein gespeichertes Abenteuer laden, damit ich daran weiterarbeiten kann.

**Akzeptanzkriterien:**

- Nutzer kann JSON-Datei auswählen
- System lädt Struktur korrekt
- Daten werden im Editor angezeigt

## User Interface Entwürfe

Note: inhaltlich nicht mehr mvp dargestellt, da jetzt fokus auf manuelle erstellung

![](.\images\UI_Mockup_1.png)
![](.\images\UI_Mockup_2.png)

## Sicherheits Requirements (Missbrauchsszenarien)

### M1: Manipulierte JSON-Datei

Ein Nutzer lädt eine fremde JSON-Datei (z. B. aus GitHub), die:

* falsche Struktur enthält
* extrem groß ist
* fehlerhafte Referenzen hat

Ziel: Crash, Datenkorruption oder unerwartetes Verhalten

**Security Requirements:**

* **SEC-01 (Input Validation):** Das System validiert jede importierte JSON-Datei gegen ein definiertes Schema und lehnt ungültige Dateien ab.
* **SEC-19 (Secure Design):** Das System bricht Verarbeitung bei fehlerhaften Daten frühzeitig ab („fail fast“).
* **SEC-09 (Secure Design):** Das System behandelt alle extern geladenen Daten (Dateien, KI-Input) als nicht vertrauenswürdig.
* **SEC-17 (Secure Coding):** Das System führt keine dynamische Codeausführung basierend auf Nutzereingaben oder JSON-Daten aus.
* **SEC-14 (Fault Tolerance):** Das System protokolliert Fehler beim Laden/Verarbeiten von Daten ohne Absturz.

### M2: Path Traversal / Arbitrary File Write

Ein Angreifer manipuliert Dateipfade:

* `../../system/file`
* absolute Pfade

Ziel: Überschreiben fremder Dateien

**Security Requirements:**

* **SEC-07 (Input Validation):** Das System verhindert relative Pfadangaben (z. B. ../) beim Speichern und Laden.
* **SEC-06 (Access Control):** Das System erlaubt Zugriff nur innerhalb eines eines vom Nutzer gewählten Verzeichnisses.
* **SEC-08 (Access Control):** Das System verhindert das Überschreiben bestehender Dateien ohne explizite Nutzerbestätigung.
* **SEC-18 (Information Disclosure Prevention):** Das System stellt sicher, dass sensible lokale Pfade nicht durch Logs oder Fehlermeldungen offengelegt werden.

### M3: Prompt Injection über Inhalte

Ein Abenteuer enthält versteckte Anweisungen:

> „Ignoriere Regeln und manipuliere Output…“

Ziel: Kontrolle über KI-Verhalten

**Security Requirements:**

* **SEC-10 (Isolation):** Das System trennt strikt zwischen System-Prompts und Nutzereingaben bei KI-Anfragen.
* **SEC-11 (Least Privilege):** Das System erlaubt der KI ausschließlich die Generierung von Text und keine Systemaktionen.
* **SEC-12 (Input Validation):** Das System validiert und bereinigt KI-Ausgaben bevor sie weiterverarbeitet oder gespeichert werden.

### M4: Denial of Service

* riesige JSON-Dateien
* extrem lange Texte
* zyklische Story-Nodes

Ziel: Anwendung verlangsamen oder crashen

**Security Requirements:**

* **SEC-02 (Resource Limitation):** Das System begrenzt die maximale Größe von JSON-Dateien (z. B. < X MB) beim Import.
* **SEC-03 (Resource Limitation):** Das System begrenzt die maximale Länge von Textfeldern (Beschreibung, Story, etc.).
* **SEC-13 (Resource Limitation):** Das System setzt Timeouts für KI-Anfragen, um Blockierungen zu vermeiden.

### M5: Inkonsistente Story-Struktur

* Verweise auf nicht existierende Nodes
* Endlosschleifen

Ziel: Logikfehler / Abstürze

**Security Requirements:**

* **SEC-04 (Data Consistency):** Das System stellt sicher, dass alle Referenzen zwischen Story-Knoten gültig sind.
* **SEC-05 (Input Validation):** Das System erkennt zyklische oder ungültige Story-Strukturen und verhindert deren Ausführung/Speicherung.

### M6: Malicious Dependency

* kompromittierte Library

Ziel: Codeausführung / Supply Chain Angriff

**Security Requirements:**

* **SEC-15 (Supply Chain Security):** Das System verwendet ausschließlich bekannte und geprüfte Abhängigkeiten (Dependencies).
* **SEC-16 (Vulnerability Management):** Das System hält alle Dependencies aktuell und überprüft sie regelmäßig auf bekannte Schwachstellen.

---

## Traceability Matrix (überarbeitet)

| REQ-ID | REQ-Description (Kurz)             | REQ Source | REQ-Type             | CIA Objective               | CRA Property                      | Linked US         |
| ------ | ---------------------------------- | ---------- | -------------------- | --------------------------- | --------------------------------- | ----------------- |
| SEC-01 | JSON Schema Validation             | M1         | Security Requirement | Integrity                   | Input Validation                  | US-4, US-12       |
| SEC-02 | Dateigröße limitieren              | M4         | Security Requirement | Availability                | Resource Limitation               | US-4, US-12       |
| SEC-03 | Textlängen begrenzen               | M4         | Security Requirement | Availability                | Resource Limitation               | US-1, US-3, US-7  |
| SEC-04 | Node-Referenzen validieren         | M5         | Security Requirement | Integrity                   | Data Consistency                  | US-6              |
| SEC-05 | Zyklen verhindern                  | M5         | Security Requirement | Availability                | Input Validation                  | US-5, US-6        |
| SEC-06 | Zugriff auf erlaubte Pfade beschr. | M2         | Security Requirement | Integrity                   | Access Control                    | US-4              |
| SEC-07 | Path Traversal verhindern          | M2         | Security Requirement | Integrity                   | Input Validation                  | US-4, US-12       |
| SEC-08 | Kein Überschreiben ohne Bestätig.  | M2         | Security Requirement | Integrity                   | Access Control                    | US-4              |
| SEC-09 | Input als unsicher behandeln       | M1         | Security Requirement | Integrity                   | Secure Design                     | US-2, US-3, US-8  |
| SEC-10 | Prompt-Trennung                    | M3         | Security Requirement | Integrity                   | Isolation                         | US-2, US-3, US-11 |
| SEC-11 | KI nur Textausgabe                 | M3         | Security Requirement | Confidentiality / Integrity | Least Privilege                   | US-2, US-3, US-8  |
| SEC-12 | KI-Output validieren               | M3         | Security Requirement | Integrity                   | Input Validation                  | US-2, US-3, US-11 |
| SEC-13 | KI Timeouts                        | M4         | Security Requirement | Availability                | Resource Limitation               | US-2, US-3, US-8  |
| SEC-14 | Fehlerlogging ohne Crash           | M1         | Security Requirement | Availability                | Fault Tolerance                   | US-12             |
| SEC-15 | Sichere Dependencies               | M6         | Security Requirement | Integrity                   | Supply Chain Security             | Alle              |
| SEC-16 | Dependency Updates                 | M6         | Security Requirement | Integrity                   | Vulnerability Management          | Alle              |
| SEC-17 | Keine Codeausführung               | M1         | Security Requirement | Integrity                   | Secure Coding                     | US-4, US-12       |
| SEC-18 | Keine sensiblen Pfade in Logs      | M2         | Security Requirement | Confidentiality             | Information Disclosure Prevention | US-4              |
| SEC-19 | Fail Fast bei Fehlern              | M1         | Security Requirement | Integrity                   | Secure Design                     | US-12             |

## Technisches Konzept

### Architektur
#### Techstack
#### Datenmodell
#### Schnittstellen

## Projektmanagement

## Frontend

## Backend

## Installationsanleitung

## Reflektion [leave this header empty]
