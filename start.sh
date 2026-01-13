#!/bin/sh
# Run Prisma DB Push to ensure schema is secure
echo "Regenerating Prisma Client..."
npx prisma generate
echo "Pushing database schema..."
npx prisma db push --accept-data-loss

# Check if migrations ran successfully (optional but good context)
if [ $? -eq 0 ]; then
    echo "Database schema pushed successfully."
else
    echo "Error pushing database schema!"
    exit 1
fi

echo "Starting Next.js..."
node server.js
