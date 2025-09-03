# # Etapa 1: build
# FROM node:18-alpine as builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build

# # Etapa 2: producción
# FROM node:18-alpine
# WORKDIR /app
# COPY --from=builder /app/.output ./.output
# EXPOSE 3000
# CMD ["node", ".output/server/index.mjs"]

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
ENV NUXT_TELEMETRY_DISABLED=1
CMD ["npm", "run", "dev"]