#!/bin/sh
# Jet Fighter — install and update for Zed.
#
#   curl -fsSL https://chrisnicholson30.github.io/Jet-Fighter-Theme/install.sh | sh
#
# Run it to install. Run it again to update — it is the same command either way,
# and it will tell you which one it did. Nothing is written until the download
# has been fetched and validated, and nothing here needs sudo.
#
#   --check      report what would happen, write nothing
#   --uninstall  remove the theme
#   --help       this text
#
# Environment:
#   JF_REF         git ref to install from (default: main)
#   ZED_CONFIG_DIR override the Zed config directory
#
# Read this script before piping it to a shell. It is deliberately short.

set -eu

REF="${JF_REF:-main}"
REPO="ChrisNicholson30/Jet-Fighter-Theme"
SRC="https://raw.githubusercontent.com/${REPO}/${REF}/themes/jet-fighter.json"
FILE="jet-fighter.json"

# ANSI, but only when we are actually attached to a terminal.
if [ -t 1 ]; then
  B=$(printf '\033[1m'); DIM=$(printf '\033[2m'); OK=$(printf '\033[32m')
  WARN=$(printf '\033[33m'); ERR=$(printf '\033[31m'); R=$(printf '\033[0m')
else
  B=''; DIM=''; OK=''; WARN=''; ERR=''; R=''
fi

say()  { printf '%s\n' "$*"; }
fail() { printf '%sjet-fighter:%s %s\n' "$ERR" "$R" "$*" >&2; exit 1; }

usage() {
  sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
}

# ---------------------------------------------------------------- config dir
config_dir() {
  if [ -n "${ZED_CONFIG_DIR:-}" ]; then
    printf '%s' "$ZED_CONFIG_DIR"
  elif [ -n "${XDG_CONFIG_HOME:-}" ]; then
    printf '%s/zed' "$XDG_CONFIG_HOME"
  else
    printf '%s/.config/zed' "$HOME"
  fi
}

# ------------------------------------------------------------------ fetching
fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1" -o "$2"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$2" "$1"
  else
    fail "need curl or wget"
  fi
}

# Validate before we go anywhere near the user's config. A truncated download
# or a captive-portal HTML page must never land on a working theme file.
validate() {
  f="$1"
  [ -s "$f" ] || return 1
  head -c 1 "$f" | grep -q '{' || return 1
  grep -q '"Jet Fighter Afterburner"' "$f" || return 1
  grep -q '"Jet Fighter Stealth"' "$f" || return 1
  grep -q '"Jet Fighter Contrail"' "$f" || return 1
  grep -q '"Jet Fighter Hyperjet"' "$f" || return 1
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$f" >/dev/null 2>&1 || return 1
  elif command -v node >/dev/null 2>&1; then
    node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$f" >/dev/null 2>&1 || return 1
  fi
  return 0
}

variants() {
  say "  ${DIM}Afterburner${R}  dark      the reference build"
  say "  ${DIM}Stealth${R}      OLED      true black, 0.71x the modelled draw"
  say "  ${DIM}Contrail${R}     light     daylight legibility"
  say "  ${DIM}Hyperjet${R}     special   warm dark, burner red"
}

# ---------------------------------------------------------------------- main
ACTION=install
for arg in "$@"; do
  case "$arg" in
    --check)     ACTION=check ;;
    --uninstall) ACTION=uninstall ;;
    -h|--help)   usage ;;
    *)           fail "unknown option: $arg (try --help)" ;;
  esac
done

DIR="$(config_dir)/themes"
DEST="$DIR/$FILE"

if [ "$ACTION" = uninstall ]; then
  if [ -f "$DEST" ]; then
    rm -f "$DEST"
    say "${OK}removed${R} $DEST"
  else
    say "nothing to remove at $DEST"
  fi
  exit 0
fi

TMP="$(mktemp "${TMPDIR:-/tmp}/jet-fighter.XXXXXX")"
trap 'rm -f "$TMP"' EXIT INT TERM

fetch "$SRC" "$TMP" || fail "could not download from $SRC"
validate "$TMP" || fail "downloaded file is not a valid Jet Fighter theme — nothing was written"

if [ -f "$DEST" ] && cmp -s "$TMP" "$DEST"; then
  STATE="current"
elif [ -f "$DEST" ]; then
  STATE="update"
else
  STATE="new"
fi

if [ "$ACTION" = check ]; then
  case "$STATE" in
    current) say "${OK}up to date${R}  $DEST" ;;
    update)  say "${WARN}update available${R}  $DEST" ;;
    new)     say "${WARN}not installed${R}  would install to $DEST" ;;
  esac
  exit 0
fi

if [ "$STATE" = current ]; then
  say "${OK}Jet Fighter is up to date.${R} ${DIM}$DEST${R}"
  exit 0
fi

mkdir -p "$DIR" || fail "could not create $DIR"
cp "$TMP" "$DEST.new" || fail "could not write to $DIR"
mv -f "$DEST.new" "$DEST" || fail "could not replace $DEST"

if [ "$STATE" = update ]; then
  say ""
  say "${OK}${B}Jet Fighter updated.${R}"
  say "  ${DIM}$DEST${R}"
  say ""
  say "  Zed picks it up on reload — ${B}cmd-shift-p${R} then ${B}reload${R},"
  say "  or just reopen the window."
else
  say ""
  say "${OK}${B}Jet Fighter installed.${R}"
  say "  ${DIM}$DEST${R}"
  say ""
  variants
  say ""
  say "  Pick one: ${B}cmd-shift-p${R} then ${B}theme selector${R}."
fi
say ""
say "  ${DIM}Run this same command again any time to update.${R}"
say ""
