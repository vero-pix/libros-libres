#!/bin/bash
# Ejecuta un envío de la encuesta desde launchd.
#
# launchd y no cron: cron en macOS NO recupera una ejecución perdida — si el Mac
# está durmiendo a la hora, simplemente no pasa nada. launchd con
# StartCalendarInterval la dispara al despertar.
#
# El script de envío lleva su propio registro (scripts/.encuesta_enviados.json),
# así que si esto corriera dos veces no le escribe a nadie dos veces.
#
# Uso:  _encuesta_programada.sh pendientes | grupo-b
set -o pipefail
cd /Users/veronicavelasquez/dev/libros-libres || exit 1
NODE=/Users/veronicavelasquez/.local/share/fnm/node-versions/v20.19.6/installation/bin/node
LOG="logs/encuesta-$1-$(date +%Y%m%d-%H%M).log"

{
  echo "=== $(date) · tarea: $1 ==="
  case "$1" in
    pendientes) "$NODE" scripts/_encuesta_correo.mjs --grupo a --pendientes --enviar ;;
    grupo-b)    "$NODE" scripts/_encuesta_correo.mjs --grupo b --enviar ;;
    *)          echo "tarea desconocida: $1"; exit 1 ;;
  esac
  echo
  echo "=== respuestas recibidas hasta ahora ==="
  "$NODE" scripts/_encuesta_resultados.mjs 2>&1 | head -60
} >> "$LOG" 2>&1

# Resumen corto en un archivo fijo, fácil de mirar de un vistazo
{
  echo "$(date '+%Y-%m-%d %H:%M') · $1"
  echo "  enviados: $(grep -c '✅' "$LOG" 2>/dev/null)"
  echo "  fallidos: $(grep -c '❌' "$LOG" 2>/dev/null)"
  echo "  detalle:  $LOG"
} >> logs/encuesta-resumen.txt

# Un solo tiro: StartCalendarInterval con Month/Day se repetiría cada año, así que
# la tarea se descarga sola apenas termina. Para rearmarla: launchctl load ...
case "$1" in
  pendientes) LABEL=cl.vero.encuesta-pendientes ;;
  grupo-b)    LABEL=cl.vero.encuesta-grupob ;;
esac
[ -n "$LABEL" ] && launchctl unload "$HOME/Library/LaunchAgents/$LABEL.plist" 2>/dev/null
