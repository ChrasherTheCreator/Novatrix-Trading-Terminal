---
name: "ArtifactCloner"
description: "Automatisiertes Klonen von Antigravity-Artefakten in den Novatrix-Trading-Ordner"
version: "1.2.0"
scope: "workspace"
events:
  - "artifact_updated"
  - "task_finalized"
---

# ArtifactCloner Skill

Dieser Skill stellt sicher, dass alle strategischen Artefakte (Pläne, Walkthroughs, Architektur-Diagramme), die der Gemini-Agent in der Antigravity-Cloud erstellt, sofort lokal im Dateisystem verfügbar sind.

## Konfiguration

- **Zielverzeichnis:** `C:\Users\Chris\Dokumente\Trading\Novatrix\logs\artifacts`
- **Format:** Markdown (UTF-8)

## Logik

```powershell
# 1. Zielpfad definieren und sicherstellen, dass er existiert
$basePath = "C:\Users\Chris\Dokumente\Trading\Novatrix\logs\artifacts"
if (!(Test-Path $basePath)) {
    New-Item -ItemType Directory -Path $basePath -Force | Out-Null
}

# 2. Aktuellen Implementierungsplan abrufen
# Nutzt den Gemini-CLI-Befehl zum Extrahiert des 'plan' Artefakts
try {
    gemini agent artifacts get plan --format=markdown | Out-File -FilePath "$basePath\latest_plan.md" -Encoding utf8 -Force
} catch {
    Write-Warning "Plan-Artefakt konnte nicht abgerufen werden."
}

# 3. Den Walkthrough (Änderungshistorie) mit Zeitstempel speichern
$timeStamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
try {
    gemini agent artifacts get walkthrough --format=markdown | Out-File -FilePath "$basePath\walkthrough_$timeStamp.md" -Encoding utf8 -Force
} catch {
    Write-Warning "Walkthrough-Artefakt konnte nicht abgerufen werden."
}

# 4. Zusammenfassung für die Konsole
Write-Host "---" -ForegroundColor Cyan
Write-Host "Gemini CLI Companion: Artefakte erfolgreich nach $basePath geklont." -ForegroundColor Green
Write-Host "Zeitstempel: $timeStamp" -ForegroundColor Gray
Write-Host "---" -ForegroundColor Cyan
```
