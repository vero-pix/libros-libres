#!/bin/bash
# Prepara un lote de fotos de vendedor para bulk-upload-csv.ts --photos
#
# Las fotos llegan como las saca la cámara: ~2 MB cada una. El lote de Casa
# Emunah eran 2.023 fotos = 4,3 GB. Subir eso a Supabase Storage es lento y caro,
# y en una ficha no se nota la diferencia: a 1400px de ancho y calidad 80 quedan
# en ~250 KB, o sea el lote entero baja a ~500 MB.
#
#   ./scripts/preparar-fotos-lote.sh <carpeta-origen> <carpeta-destino>
#
# Los zips de Google Drive hay que descomprimirlos antes (ojo con los nombres:
# Drive los zipea en cp437 y las tildes salen rotas; `ditto -k` los respeta).
set -euo pipefail

ORIGEN="${1:?Falta la carpeta de origen}"
DESTINO="${2:?Falta la carpeta de destino}"
ANCHO="${ANCHO:-1400}"
CALIDAD="${CALIDAD:-80}"

mkdir -p "$DESTINO"
total=$(find "$ORIGEN" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) | wc -l | tr -d ' ')
echo "fotos encontradas: $total"
echo "destino: $DESTINO  (ancho máx ${ANCHO}px, calidad ${CALIDAD})"

n=0
find "$ORIGEN" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0 |
while IFS= read -r -d '' f; do
  n=$((n+1))
  # El nombre se conserva TAL CUAL: es lo que usa el cargador para calzar la
  # foto con la fila del CSV. Si se renombra, se pierde el match.
  base=$(basename "$f")
  magick "$f" -auto-orient -resize "${ANCHO}x${ANCHO}>" -quality "$CALIDAD" -strip "$DESTINO/${base%.*}.jpg" 2>/dev/null || {
    echo "  ⚠️  no se pudo procesar: $base"; continue; }
  [ $((n % 200)) -eq 0 ] && echo "  ... $n de $total"
done

echo
echo "antes:  $(du -sh "$ORIGEN" | cut -f1)"
echo "después: $(du -sh "$DESTINO" | cut -f1)"
echo "listo. Para cargar:  npx tsx scripts/bulk-upload-csv.ts <csv> --seller <uuid> --photos $DESTINO"
