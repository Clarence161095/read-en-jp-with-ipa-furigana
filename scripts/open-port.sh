#!/usr/bin/env bash
# =============================================================================
# open-port.sh
# Opens TCP port 5678 on the EC2 instance OS-level firewall.
#
# NOTE: You must ALSO open port 5678 in the EC2 Security Group via the
# AWS Console or CLI (this script only handles the in-OS firewall).
# =============================================================================
set -euo pipefail

PORT=5678

echo "============================================================"
echo "  Opening port $PORT on OS firewall"
echo "============================================================"
echo ""

CHANGED=0

# ── iptables ──────────────────────────────────────────────────────────────────
if command -v iptables &>/dev/null; then
  # Check if rule already exists
  if sudo iptables -C INPUT -p tcp --dport "$PORT" -j ACCEPT &>/dev/null; then
    echo "✅ iptables rule for port $PORT already exists"
  else
    echo "⚙️  Adding iptables INPUT rule for port $PORT..."
    sudo iptables -I INPUT -p tcp --dport "$PORT" -j ACCEPT
    CHANGED=1
    echo "✅ iptables rule added"
  fi

  # Persist iptables rules across reboots (try multiple methods)
  if command -v iptables-save &>/dev/null; then
    if [ -d /etc/iptables ]; then
      sudo iptables-save | sudo tee /etc/iptables/rules.v4 >/dev/null
    elif command -v service &>/dev/null; then
      sudo service iptables save 2>/dev/null || true
    fi
  fi
fi

# ── firewalld ─────────────────────────────────────────────────────────────────
if command -v firewall-cmd &>/dev/null && sudo systemctl is-active --quiet firewalld 2>/dev/null; then
  if sudo firewall-cmd --query-port="${PORT}/tcp" --permanent &>/dev/null; then
    echo "✅ firewalld rule for port $PORT already exists"
  else
    echo "⚙️  Adding firewalld rule for port $PORT..."
    sudo firewall-cmd --permanent --add-port="${PORT}/tcp"
    sudo firewall-cmd --reload
    CHANGED=1
    echo "✅ firewalld rule added and reloaded"
  fi
fi

# ── nftables ──────────────────────────────────────────────────────────────────
if command -v nft &>/dev/null && sudo systemctl is-active --quiet nftables 2>/dev/null; then
  echo "⚙️  Checking nftables for port $PORT..."
  if sudo nft list ruleset | grep -q "tcp dport $PORT"; then
    echo "✅ nftables rule for port $PORT already exists"
  else
    sudo nft add rule inet filter input tcp dport "$PORT" accept 2>/dev/null || true
    echo "✅ nftables rule added"
    CHANGED=1
  fi
fi

echo ""
echo "============================================================"
echo "  OS firewall configuration done"
echo "============================================================"
echo ""

# ── Verify ────────────────────────────────────────────────────────────────────
echo "Listening sockets on port $PORT:"
sudo ss -tlnp | grep "$PORT" || echo "  (app may not be running yet)"
echo ""

echo "⚠️  REMINDER: You must also open port $PORT in the AWS Security Group:"
echo "   AWS Console → EC2 → Security Groups → Inbound rules → Add rule"
echo "   Type: Custom TCP  |  Port: $PORT  |  Source: 0.0.0.0/0"
echo ""

PUBLIC_IP=$(curl -sf --connect-timeout 3 http://169.254.169.254/latest/meta-data/public-ipv4 \
  || curl -sf --connect-timeout 3 https://ifconfig.me \
  || echo "<YOUR-EC2-IP>")
echo "Once both are done, your app should be reachable at:"
echo "  http://${PUBLIC_IP}:${PORT}"
