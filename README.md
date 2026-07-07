# 📄 CV-Generator

PDF-Generator für professionelle Bewerbungsmappen – webbasiert, mit Live-Vorschau und JSON-Datenladen.

## Schnellstart

```bash
npm install
npm run dev
```

→ Öffnet automatisch `http://localhost:3000`

## Features

| Feature        | Beschreibung                                          |
| -------------- | ----------------------------------------------------- |
| 🔄 HMR         | Vite Hot Module Reload – Änderungen sofort sichtbar   |
| 📦 JSON-Daten  | Alle Inhalte in `src/bewerbung.json`                  |
| 🖨 PDF-Export  | `window.print()` → Als PDF speichern (Browser-Dialog) |
| 📱 Mehrseitig  | Automatischer Seitenumbruch bei langen Lebensläufen   |
| ✏️ Live-Editor | JSON direkt in der Sidebar bearbeiten                 |

## Struktur

```
bewerbung-generator/
├── src/
│   ├── index.html        # App + Rendering Engine
│   ├── bewerbung.json    # Alle Bewerbungsdaten
│   └── template.xml      # Seitenstruktur / Layout-Definition
├── package.json
├── vite.config.js
└── README.md
```

## JSON anpassen

Öffne `src/bewerbung.json` und passe deine Daten an (Lässt man unter bewerbung `"datum":""` den Stringwert leer wird das aktuelle Datum automatisch erzeugt und eingetragen!):

```json
{
  "person": {
    "vorname": "Max",
    "nachname": "Mustermann",
    "foto": "foto.jpg",   ← Foto in src/ ablegen
    ...
  },
  "bewerbung": { ... },
  "anschreiben": { ... },
  "lebenslauf": { ... },
  "anlagen": [ ... ]
}
```

## PDF erzeugen

1. Klick auf **„Als PDF drucken"** (oder `Strg+P`)
2. Drucker: **„Als PDF speichern"** wählen
3. Papierformat: **A4**, Ränder: **Keine**
4. Hintergrundgrafiken: ✅ aktivieren

## Bewerbungsfoto einbinden

Foto (JPG/PNG) in `src/` kopieren und im JSON eintragen:

```json
"foto": "mein-foto.jpg"
```

## Anlagen Einbinden

`src/assets/merge_bewerbung.py` mit Python ausführen.
Entsprechende Anlagen Bezeichnungen in der Python-Datei anpassen.
Es können beliebig viele Anlagen hinzugefügt werden!

**Hier die Pfade zu deinen Dateien anpassen**

```python
HAUPT_PDF = "bewerbungsmappe.pdf"
BACHELOR_ZEUGNIS = "bachelor-zeugnis.pdf" # 1 Seite
ARBEITSZEUGNIS = "arbeitszeugnis.pdf" # 2 Seiten
ZERTIFIKAT_1 = "zertifikat-ki-poweruser.pdf" # 1 Seite
ZERTIFIKAT_2 = "zertifikat-fullstack.pdf" # 1 Seite

REIHENFOLGE = [HAUPT_PDF, ARBEITSZEUGNIS, BACHELOR_ZEUGNIS, ZERTIFIKAT_1, ZERTIFIKAT_2]

AUSGABE = "Bewerbungsmappe_final.pdf"
```
