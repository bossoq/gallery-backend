#!/bin/bash

FILE=/app/caches/migrated

if test -f "$FILE"; then
    echo "Already migrated"
else
    echo "Migrating..."
    yarn set version stable
    yarn install
    yarn add @img/sharp-linux-x64@0.33.2
    npx prisma generate --schema=./prisma/schema.prisma
    npx prisma migrate reset --schema=./prisma/schema.prisma --force
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    rm -rf /app/caches/*
    yarn migrate
    echo "Migration complete"
    touch "$FILE"
fi
