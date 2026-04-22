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

## Technisches Konzept

## Projektmanagement

## Frontend

## Backend

## Installationsanleitung

## Reflektion [leave this header empty]
