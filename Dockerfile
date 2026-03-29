# Build from monorepo root so npm workspaces (@heart-and-hustle/shared) resolve.
FROM node:20-alpine
WORKDIR /app

COPY . .
RUN npm ci && npm run build:web

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["npm", "run", "start", "-w", "web"]
