# EconWar — production image for the static single-player client.
# Multi-stage: build the monorepo, then serve apps/client/dist on $PORT.
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm --workspace @econwar/client run build

FROM node:20-alpine AS run
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/apps/client/dist ./dist
ENV PORT=8080
EXPOSE 8080
# -s = SPA fallback to index.html; bind to the platform-provided $PORT.
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
