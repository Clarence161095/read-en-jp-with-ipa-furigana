#!/bin/sh
set -e

mkdir -p /app/db /app/storage/articles

echo "Running migrations..."
node node_modules/prisma/build/index.js migrate deploy --schema /app/prisma/schema.prisma

echo "Seeding database..."
node /app/prisma/seed-docker.js

echo "Starting Next.js on port ${PORT:-5678}..."
exec node server.js

