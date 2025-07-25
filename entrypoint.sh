#!/bin/sh

set -e

echo "Running migrations"
bun run setup
echo "Migration finished"

bun run start
