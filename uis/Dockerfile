FROM node:20-alpine

RUN apk add --no-cache bash

WORKDIR /workspace

# Copy dependency files from repo root (docker build context = repo root)
COPY uis/application/package.json uis/application/package-lock.json ./application/
RUN npm --prefix application ci --no-audit --no-fund

COPY uis/backoffice/package.json uis/backoffice/package-lock.json ./backoffice/
RUN npm --prefix backoffice ci --no-audit --no-fund

# Copy application source
COPY uis/application ./application
COPY uis/backoffice ./backoffice
COPY uis/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000 3001 8080
CMD ["./start.sh"]