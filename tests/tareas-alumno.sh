#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
paquete="$(mktemp -d)"
trap 'rm -f "$paquete/tareas.cjs"; rmdir "$paquete"' EXIT
node_modules/.bin/esbuild tests/tareas-alumno.test.mjs --bundle --platform=node --outfile="$paquete/tareas.cjs"
node "$paquete/tareas.cjs"
