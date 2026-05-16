#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web (remote) environments.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

LOG=/tmp/session-start-hook.log

{
  # FFmpeg is required by HyperFrames to encode rendered frames into MP4
  # (`npx hyperframes render`). Skip the apt step if it's already present.
  if ! command -v ffmpeg >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    if command -v sudo >/dev/null 2>&1 && [ "$(id -u)" -ne 0 ]; then
      SUDO=sudo
    else
      SUDO=
    fi
    # Some base images carry third-party PPAs that the environment's
    # network policy blocks (403). Those make `apt-get update` exit
    # non-zero even though the core Ubuntu repos (which provide ffmpeg)
    # refresh fine, so don't let that abort the hook. The subsequent
    # install is the real success check.
    $SUDO apt-get update -y || echo "apt-get update had errors (likely blocked third-party PPAs) -- continuing"
    $SUDO apt-get install -y --no-install-recommends ffmpeg
  fi

  # Project dependencies. `npm install` (not `ci`) so the populated
  # node_modules is reused from the cached container state.
  if [ -f package.json ]; then
    npm install --no-audit --no-fund
  fi
} >"$LOG" 2>&1

ffmpeg_ver="$(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}')"
echo "session-start hook: ffmpeg ${ffmpeg_ver:-MISSING} ready, npm deps installed (log: $LOG)"
