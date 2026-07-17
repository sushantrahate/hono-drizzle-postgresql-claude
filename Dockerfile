# ---- deps: install dependencies only, cached unless package.json/lockfile changes ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript to dist/ ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime: slim final image, no source, no dev deps, no build tools ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Run as the non-root user Node's official image already provides
USER node

EXPOSE 4000

CMD ["node", "dist/server.js"]