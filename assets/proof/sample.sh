#!/usr/bin/env bash
# Proof corpus — shell.
# Exercises: shebang, variables, expansion, heredoc, conditionals, functions.
set -euo pipefail

readonly CEILING_FT=65000
CALLSIGN="${1:-JF-001}"
declare -A TELEMETRY=([alt]=0 [mach]=0)

climb() {
  local feet="$1"
  if (( feet > CEILING_FT )); then
    printf 'error: %d exceeds ceiling %d\n' "$feet" "$CEILING_FT" >&2
    return 1
  fi
  TELEMETRY[alt]="$feet"
}

main() {
  [[ "$CALLSIGN" =~ ^[A-Z]{2}-[0-9]{3}$ ]] || { echo "bad callsign: $CALLSIGN" >&2; exit 2; }
  climb "${2:-40000}"
  cat <<-REPORT
	callsign : ${CALLSIGN}
	altitude : ${TELEMETRY[alt]} ft
	REPORT
}

main "$@"
