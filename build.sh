#!/bin/bash
# Render Build Script for HospitalRun
# Optimized for Render free tier (512MB RAM)

set -e

echo "=== HospitalRun Build Script ==="

# Push database schema (skip generate - already done in postinstall)
echo "Step 1: Pushing database schema..."
npx prisma db push --skip-generate

# Build the Next.js application
echo "Step 2: Building Next.js application..."
npm run build

echo "=== Build Complete! ==="
echo ""
echo "NOTE: To seed the database, run: npm run render-seed"
echo "      Or set the seed command in Render's build command:"
echo "      npm install && npm run render-build && npm run render-seed"
