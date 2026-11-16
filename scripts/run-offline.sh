#!/usr/bin/env bash
# Run a command without external networking, retaining loopback and the caller.
set -euo pipefail

exec sudo --preserve-env unshare --net -- bash -c '
  set -euo pipefail
  ip link set lo up
  user="$1"
  shift
  exec sudo --preserve-env --user="$user" -- "$@"
' bash "$(id -un)" env "PATH=$PATH" "$@"
