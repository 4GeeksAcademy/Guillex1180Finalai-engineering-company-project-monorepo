FROM node:22-alpine
WORKDIR /app
COPY uis/application/package.json uis/application/package-lock.json ./uis/application/
WORKDIR /app/uis/application
RUN npm ci
ENV TRACKFLOW_API_URL=https://trackflow-api-production.up.railway.app
COPY uis/application/ ./
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npm run start -- --hostname 0.0.0.0 --port ${PORT:-3000}"]
