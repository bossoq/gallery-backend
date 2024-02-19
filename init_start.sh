#!/bin/bash

FILE=/app/caches/migrated

if test -f "$FILE"; then
    echo "Already migrated"
    yarn start
else
    echo "Migrating..."
    npx prisma generate --schema=./prisma/schema.prisma
    npx prisma migrate reset --schema=./prisma/schema.prisma --force
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    yarn add @img/sharp-linux-x64@0.33.2
    rm -rf /app/caches/*
    yarn migrate
    echo "Migration complete"
    touch "$FILE"
    yarn start
fi
