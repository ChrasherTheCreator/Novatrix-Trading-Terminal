# Novatrix Project Guide

Diese Anleitung erklärt, wie du die Novatrix Trading-Plattform lokal startest.

## 1. Voraussetzungen

- **Rust** (für das Backend)
- **Node.js & npm** (für das Frontend)
- **SQLite** (wird automatisch vom Backend erstellt)

---

## 2. Server starten (Backend)

Wechsle in das Backend-Verzeichnis und starte den Rust-Server:

```powershell
cd backend
cargo run
```

- **Port:** Standardmäßig auf `http://localhost:3001`
- **Tipp:** Nutze `cargo watch -x run` für automatisches Neustarten bei Code-Änderungen.

---

## 3. Website starten (Frontend)

Öffne ein zweites Terminal, wechsle in das Frontend-Verzeichnis und starte den Entwicklungsserver:

```powershell
cd frontend
npm install  # Nur beim ersten Mal nötig
npm run dev
```

- **URL:** Meistens `http://localhost:5173` (wird in der Konsole angezeigt)

---

## 4. Lokalen Chache leeren (wenn website nur als Blcakscreen angezeigt wird)

an die url ?reset=true anhängen
z.B. localhost:5173/?reset=true

## Kurz-Übersicht der Befehle

| Komponente   | Verzeichnis  | Befehl        |
| :----------- | :----------- | :------------ |
| **Backend**  | `./backend`  | `cargo run`   |
| **Frontend** | `./frontend` | `npm run dev` |

---

## Fehlerbehebung

- **Datenbank Fehler:** Das Backend erstellt die Datei `novatrix.db` automatisch im Root des Backend-Ordners. Falls die Datenbank korrupt ist, kannst du diese Datei löschen und den Server neu starten.
- **Node Modules:** Falls das Frontend nicht startet, lösche den Ordner `node_modules` im Frontend-Verzeichnis und führe `npm install` erneut aus.
