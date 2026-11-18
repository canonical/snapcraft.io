#!/usr/bin/env bash
# Run a command without external networking, retaining loopback and the caller.
set -euo pipefail

# Pass the environment explicitly: sudo-rs ignores bare --preserve-env.
mapfile -d '' -t environment < <(env -0)

exec sudo -- env "${environment[@]}" unshare --net -- bash -c '
  set -euo pipefail
  ip link set lo up
  user="$1"
  shift
  exec sudo --user="$user" -- "$@"
' bash "$(id -un)" env "${environment[@]}" "$@"
