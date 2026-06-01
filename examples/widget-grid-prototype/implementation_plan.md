# Widget Grid Dashboard System – Implementation Plan

Aufbau eines vollwertigen Widget-Grid-Systems als Testumgebung für alle 20 Trading-Widgets, mit Drag & Drop, Resize, Edit-Modus, Widget-Bibliothek, Layout-Persistenz und dem bestehenden Obsidian/Purple-Design.

## Widget-Größen-Analyse → Grid-Berechnung

Alle 20 Widgets wurden analysiert. Breiten reichen von 250px bis 1100px:

| Kategorie | Widgets | Originalbreite | Grid-Spalten (von 12) | Min-Höhe (Rows) |
|---|---|---|---|---|
| **Small KPI** | P&L Status, Profit Factor, Sharpe Ratio, Winrate, Total Trades, Novatrix Score, Session Timer, Equity Drawdown | 250px | **2** | 2 |
| **Medium** | Performance Radar (300px), Mistake Losses (350px), Playbook Efficiency (350px) | 300–350px | **3** | 3 |
| **Medium-Large** | Asset Performance (440px), Scatter Plot (450px), Psych. Energy (460px) | 440–460px | **4** | 3–4 |
| **Large (Chart)** | Drawdown Daily/Session (480px), Cumulative P&L (720px) | 480–720px | **4–6** | 3–4 |
| **XL** | Trading Sessions (800px), Trading Calendar (840px) | 800–840px | **6–8** | 5–6 |
| **Full Width** | Temporal P&L Heatmap (1100px) | 1100px | **10–12** | 5 |

**Grid-Konfiguration:**
- **12 Spalten** auf Desktop (≥1200px)
- **Zellbreite** = `(Fensterbreite - Margins) / 12` ≈ 100–140px
- **Zeilenhöhe** = 80px (ergibt natürliche Seitenverhältnisse)
- **Gutter** = 16px konstant zwischen allen Widgets
- **Responsive**: 6 Spalten auf Tablet (768–1199px), 2 Spalten auf Mobil (<768px)

## Projektstruktur

Alles plain HTML/CSS/JS – kein Framework nötig.

### [NEW] [index.html](file:///c:/Users/Chris/Dokumente/Trading/Widget%20test%20project/index.html)
Hauptseite mit:
- Top-Navigation Bar (Logo, Customize-Button, Save-Button, Export/Import, Undo/Redo)
- Grid-Container für Widgets
- Widget-Library Drawer (Slide-in von rechts)
- Edit-Mode Overlay & Ghost-Element

### [NEW] [css/dashboard.css](file:///c:/Users/Chris/Dokumente/Trading/Widget%20test%20project/css/dashboard.css)
- Design-Tokens (CSS Custom Properties) basierend auf bestehendem Obsidian/Purple-Theme
- Grid-Layout (CSS Grid für grundlegendes Layout, JS für absolute Positionierung im Edit-Modus)
- Edit-Mode Styles (Punkte-Hintergrund, Drag-Handles, Resize-Handles, Ghost-Element Glow)
- Widget-Library Drawer Styles
- Top-Bar Styles
- Responsive Breakpoints
- Animationen & Transitions

### [NEW] [js/grid-engine.js](file:///c:/Users/Chris/Dokumente/Trading/Widget%20test%20project/js/grid-engine.js)
Kernlogik:
- `GridEngine` Klasse: Verwaltet Widget-Positionen (col, row, width, height)
- **Snap-to-Grid**: Berechnet nächste Grid-Position aus Maus-Koordinaten
- **Collision Detection**: Push-Down-Algorithmus (wie react-grid-layout)
- **Resize-Logic**: Min/Max-Constraints per Widget-Typ, Stufenweise Skalierung
- **Ghost-Element**: Glowing purple border zeigt Zielposition an

### [NEW] [js/edit-mode.js](file:///c:/Users/Chris/Dokumente/Trading/Widget%20test%20project/js/edit-mode.js)
- Toggle Edit-Mode (Customize-Button)
- Drag-Event-Handler (mousedown/mousemove/mouseup auf Drag-Handles)
- Resize-Event-Handler (mousedown auf Resize-Handles)
- Widget-Settings Dropdown (Gear-Icon)
- Undo/Redo Stack (Array von Layout-Snapshots + Ctrl+Z/Ctrl+Y)

### [NEW] [js/widget-library.js](file:///c:/Users/Chris/Dokumente/Trading/Widget%20test%20project/js/widget-library.js)
- Widget-Registry: Definition aller 20 Widgets mit `id`, `name`, `icon`, `defaultW`, `defaultH`, `minW`, `minH`, `maxW`, `maxH`, `previewSrc`
- Drawer UI: Liste aller verfügbaren Widgets mit Thumbnail-Vorschau
- Drag-from-Library: Widget aus Library auf Grid ziehen

### [NEW] [js/persistence.js](file:///c:/Users/Chris/Dokumente/Trading/Widget%20test%20project/js/persistence.js)
- `saveLayout()` → LocalStorage key `novatrix-dashboard-layout`
- `loadLayout()` → Aus LocalStorage lesen und Grid wiederherstellen
- `exportLayout()` → JSON-Datei Download
- `importLayout()` → JSON-Datei Upload und anwenden

### [NEW] [js/app.js](file:///c:/Users/Chris/Dokumente/Trading/Widget%20test%20project/js/app.js)
- Initialisierung: Default-Layout laden oder aus Storage
- Alle Module verbinden (GridEngine + EditMode + WidgetLibrary + Persistence)
- Event-Listener für Top-Bar Buttons

## Kernfunktionalitäten im Detail

### Grid-Engine (Push-Down Collision)
```
1. Beim Verschieben eines Widgets: Ghost an nächster Grid-Position anzeigen
2. Beim Loslassen:
   a. Neue Position berechnen (snap to grid)
   b. Prüfe Kollisionen mit allen anderen Widgets
   c. Kollidierte Widgets nach unten verschieben (rekursiv)
   d. Layout kompaktieren (Lücken schließen)
3. Transition: Alle verschobenen Widgets gleiten sanft zur neuen Position
```

### Widget-Mindestgrößen (in Grid-Einheiten)
| Widget | MinW | MinH | DefaultW | DefaultH | Scalable |
|---|---|---|---|---|---|
| P&L Status, Profit Factor, etc. | 2 | 2 | 2 | 2 | Nein |
| Novatrix Score, Session Timer | 2 | 2 | 2 | 3 | Nein |
| Performance Radar | 3 | 3 | 3 | 4 | Ja |
| Mistake Losses, Playbook | 3 | 3 | 3 | 4 | Ja (vertikal) |
| Asset Performance | 4 | 3 | 4 | 3 | Ja (horizontal) |
| Scatter Plot, Psych. Energy | 4 | 3 | 4 | 4 | Ja |
| Drawdown Graphs | 4 | 3 | 5 | 3 | Ja |
| Cumulative P&L | 5 | 3 | 6 | 4 | Ja |
| Trading Sessions | 6 | 4 | 8 | 4 | Ja |
| Trading Calendar | 6 | 5 | 8 | 6 | Ja |
| Temporal Heatmap | 8 | 4 | 12 | 5 | Ja |

### Widgets Integration
Jedes Widget wird als **iframe** (`srcdoc` oder `src` auf die Originaldatei) eingebettet:
- Vorteil: Bestehende Styles/Scripts bleiben isoliert, kein CSS-Konflikt
- `body`-Styles jedes Widgets werden angepasst: `background: transparent`, `height: 100%`, Zentrierungsoverrides entfernt
- Container-Element: `.widget-card` mit drag handle, resize handle, gear icon, delete button

### Edit-Mode Visuals
- Hintergrund: Feines Punktraster (CSS `radial-gradient` Pattern)
- Widgets: Subtle shake-animation beim Aktivieren (wie iOS App-Edit)
- Ghost-Element: `border: 2px dashed #a855f7`, `box-shadow: 0 0 20px rgba(168,85,247,0.4)`
- Dragged Widget: Erhöhter `box-shadow`, leichte Skalierung (`scale(1.02)`)
- Smooth Transitions: `transition: all 0.3s cubic-bezier(0.2, 1, 0.3, 1)` für Reflow

## User Review Required

> [!IMPORTANT]
> **Grid-Granularität**: 12 Spalten mit 80px Zeilenhöhe und 16px Gutter. Dies ergibt bei 1920px Viewport ca. 144px Spaltenbreite. Ist das passend oder soll das Grid feiner/gröber sein?

> [!IMPORTANT]  
> **Widget-Embedding**: Iframes garantieren Style-Isolation, verbrauchen aber mehr Ressourcen als Inline-Embedding. Bei 20 Widgets gleichzeitig könnte es bei schwächerer Hardware spürbar werden. Soll ich stattdessen Inline-Embedding mit CSS-Scoping verwenden?

> [!IMPORTANT]
> **Responsive Verhalten Mobil**: Bei 1–2 Spalten werden große Widgets wie der Kalender oder die Heatmap stark gestaucht. Sollen bestimmte Widgets auf dem Smartphone ausgeblendet werden oder horizontal scrollbar sein?

## Verification Plan

### Automatisierte Tests (Browser-basiert)
Keine bestehenden Tests im Projekt vorhanden. Verifizierung erfolgt manuell über den Browser.

### Manuelle Verifikation (Browser)
1. **Grid-Rendering**: Öffne `index.html` im Browser → Alle Widgets sollen im Grid mit korrektem Abstand angezeigt werden
2. **Edit-Mode Toggle**: Klicke "Customize" Button → Punktraster erscheint, Drag-Handles und Resize-Handles werden sichtbar
3. **Drag & Drop**: Greife ein Widget am Drag-Handle → Ghost-Element mit lila Glow zeigt Zielposition → Beim Loslassen snappt das Widget ein
4. **Collision**: Schiebe Widget A auf Widget B → Widget B gleitet nach unten (Push-Down)
5. **Resize**: Ziehe am unteren rechten Handle → Widget ändert Größe in Grid-Schritten → Mindestgröße wird eingehalten
6. **Widget Library**: Klicke auf "Add Widget" → Drawer öffnet sich → Zeigt alle 20 Widgets mit Vorschau → Widget per Button ins Grid einfügen
7. **Save/Load**: Ändere Layout → Klicke "Save" → Seite neuladen → Layout ist wiederhergestellt
8. **Export/Import**: Klicke "Export" → JSON wird heruntergeladen → Klicke "Import" → Layout wird aus JSON wiederhergestellt
9. **Undo/Redo**: Verschiebe ein Widget → Drücke Ctrl+Z → Widget geht zurück → Ctrl+Y → Widget geht wieder hin
10. **Responsive**: Browser-Fenster verkleinern → Layout wechselt zu weniger Spalten → Widgets stapeln sich
