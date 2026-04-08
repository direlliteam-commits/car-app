#!/bin/bash
set -e

echo "no" | npx drizzle-kit push --force 2>&1 | tail -10
