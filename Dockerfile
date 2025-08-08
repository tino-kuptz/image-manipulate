# Step 1: build nuxt server
FROM node:22-alpine3.22 AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --no-install-recommends --no-audit --no-fund
COPY . .
RUN npm run build

# Step 2: runtime image
FROM node:22-alpine3.22 AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache tini ca-certificates

COPY --chown=node:node --from=build /app/.output .
USER node

EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "./server/index.mjs"]