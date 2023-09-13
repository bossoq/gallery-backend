#!/bin/bash

FILE=migrated

if test -f "$FILE"; then
    echo "Already migrated"
    yarn start
else
    echo "Migrating..."
    npx prisma migrate generate --schema=./prisma/schema.prisma
    yarn migrate
    echo "Migration complete"
    touch "$FILE"
    yarn start
fi
