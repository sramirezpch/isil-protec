FROM node:24-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@11

# Install dependencies (cached as long as the manifest/lockfile don't change)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Development: hot reload with tsx watch (use with a bind-mounted ./src)
FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# Production: run the TypeScript sources directly with tsx
FROM deps AS prod
ENV NODE_ENV=production
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["pnpm", "exec", "tsx", "src/server.ts"]
