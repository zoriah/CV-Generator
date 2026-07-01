#!/usr/bin/env python3
"""
Fügt das gedruckte Bewerbungs-PDF (Deckblatt, Anschreiben, Lebenslauf,
Ausbildung, Anlagen-Übersicht) mit den 4 echten Anlagen-PDFs zu einer
finalen Bewerbungsmappe zusammen.

Reihenfolge der Anlagen: Bachelor-Zeugnis -> Arbeitszeugnis -> Zertifikat 1 -> Zertifikat 2

Nutzung:
    python3 merge_bewerbung.py

Vor dem Ausführen die Dateinamen unten ggf. anpassen oder die Dateien
einfach so benennen, wie sie hier erwartet werden.
"""

from pypdf import PdfWriter, PdfReader
import os

# ---- Hier die Pfade zu deinen Dateien anpassen ----
HAUPT_PDF = "bewerbungsmappe.pdf"          # Das per Browser-Druck erzeugte PDF
BACHELOR_ZEUGNIS = "bachelor-zeugnis.pdf"   # 1 Seite
ARBEITSZEUGNIS = "arbeitszeugnis.pdf"       # 2 Seiten
ZERTIFIKAT_1 = "zertifikat-ki-poweruser.pdf"      # 1 Seite
ZERTIFIKAT_2 = "zertifikat-fullstack.pdf"         # 1 Seite

AUSGABE = "Bewerbungsmappe_final.pdf"

REIHENFOLGE = [HAUPT_PDF, ARBEITSZEUGNIS, BACHELOR_ZEUGNIS, ZERTIFIKAT_1, ZERTIFIKAT_2]


def main():
    fehlende = [f for f in REIHENFOLGE if not os.path.isfile(f)]
    if fehlende:
        print("Folgende Dateien fehlen im aktuellen Ordner:")
        for f in fehlende:
            print(f"  - {f}")
        print("\nBitte Dateien in diesen Ordner legen oder Pfade im Skript anpassen.")
        return

    writer = PdfWriter()
    gesamt_seiten = 0
    for pdf_datei in REIHENFOLGE:
        reader = PdfReader(pdf_datei)
        for page in reader.pages:
            writer.add_page(page)
        print(f"  + {pdf_datei}: {len(reader.pages)} Seite(n)")
        gesamt_seiten += len(reader.pages)

    with open(AUSGABE, "wb") as out:
        writer.write(out)

    print(f"\nFertig: '{AUSGABE}' erstellt mit insgesamt {gesamt_seiten} Seiten.")


if __name__ == "__main__":
    main()
