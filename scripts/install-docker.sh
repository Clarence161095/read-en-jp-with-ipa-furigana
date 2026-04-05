#!/usr/bin/env bash
# =============================================================================
# install-docker.sh
# Installs Docker + Docker Compose plugin on Amazon Linux 2023.
# Safe to re-run — already-installed components are detected and skipped.
# Also configures a 1 GB swap file (critical for building on t2.micro).
# =============================================================================
set -euo pipefail

COMPOSE_VERSION="v2.27.1"   # latest stable at time of writing
SWAP_SIZE="1G"

echo "============================================================"
echo "  Docker + Docker Compose installer — Amazon Linux 2023"
echo "============================================================"
echo ""

# ── 1. Swap space ─────────────────────────────────────────────────────────────
# t2.micro has only 1 GB RAM; the Next.js build (run inside Docker) needs ~1.5 GB.
# Without swap the build WILL be OOM-killed.
if swapon --show | grep -q '/swapfile'; then
  echo "✅ Swap already active"
elif [ -f /swapfile ]; then
  echo "⚙️  Activating existing swap file..."
  sudo swapon /swapfile
  echo "✅ Swap activated"
else
  echo "💾 Creating ${SWAP_SIZE} swap file (needed for Docker build on t2.micro)..."
  sudo fallocate -l "$SWAP_SIZE" /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap  /swapfile
  sudo swapon  /swapfile
  # Persist across reboots
  grep -q '/swapfile' /etc/fstab \
    || echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
  echo "✅ Swap (${SWAP_SIZE}) created and activated"
fi
echo ""

# ── 2. Docker Engine ──────────────────────────────────────────────────────────
if command -v docker &>/dev/null && docker info &>/dev/null; then
  echo "✅ Docker already installed: $(docker --version)"
else
  echo "📦 Installing Docker Engine..."
  sudo dnf update -y
  sudo dnf install -y docker
  sudo systemctl enable --now docker
  echo "✅ Docker installed: $(docker --version)"
fi
echo ""

# ── 3. Add current user to the docker group ───────────────────────────────────
if groups "$USER" | grep -qw docker; then
  echo "✅ User '$USER' is already in the docker group"
else
  echo "👤 Adding '$USER' to the docker group..."
  sudo usermod -aG docker "$USER"
  echo "✅ Done — you must log out/in (or run 'newgrp docker') for this to take effect"
fi
echo ""

# ── 4. Docker Compose plugin ──────────────────────────────────────────────────
if docker compose version &>/dev/null; then
  echo "✅ Docker Compose already installed: $(docker compose version)"
else
  echo "📦 Installing Docker Compose plugin ${COMPOSE_VERSION}..."
  PLUGIN_DIR="/usr/local/lib/docker/cli-plugins"
  sudo mkdir -p "$PLUGIN_DIR"
  sudo curl -fsSL \
    "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o "${PLUGIN_DIR}/docker-compose"
  sudo chmod +x "${PLUGIN_DIR}/docker-compose"
  echo "✅ Docker Compose installed: $(docker compose version)"
fi
echo ""

# ── 5. Start Docker if not running ────────────────────────────────────────────
if ! sudo systemctl is-active --quiet docker; then
  echo "▶️  Starting Docker service..."
  sudo systemctl start docker
fi
echo ""

# ── 6. Summary ────────────────────────────────────────────────────────────────
echo "============================================================"
echo "  Installation complete!"
echo "============================================================"
echo ""
echo "Versions:"
echo "  $(docker --version)"
echo "  $(docker compose version)"
echo ""
echo "⚠️  IMPORTANT — if you were just added to the docker group,"
echo "   log out and back in, or run:  newgrp docker"
echo ""
echo "Next steps:"
echo "  cd /path/to/your/repo"
echo "  cp .env.docker.example .env"
echo "  nano .env                          # fill in secrets"
echo "  docker compose up -d --build"
echo ""
echo "Your app will be available at http://\$(curl -s ifconfig.me):5678"
