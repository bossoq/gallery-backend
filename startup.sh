#!/bin/bash

FILE=/app/cached/migrated

if test -f "$FILE"; then
    echo "Already migrated"
    yarn start
else
    echo "Migrating..."
    npx prisma generate --schema=./prisma/schema.prisma
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    yarn migrate
    echo "Migration complete"
    touch "$FILE"
    yarn start
fi
