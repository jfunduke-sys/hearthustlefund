# Build from monorepo root so npm workspaces (@heart-and-hustle/shared) resolve.
FROM node:20-alpine
WORKDIR /app

COPY . .
RUN npm ci && npm run build:web

ENV NODE_ENV=production
EXPOSE 3000

# Railway sets PORT; Next must listen there (default 3000 is wrong on Railway).
CMD ["sh", "-c", "exec npm run start -w web"]
