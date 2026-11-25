FROM node:20-alpine

RUN apk add --no-cache bash

WORKDIR /workspace

COPY application/package.json application/package-lock.json ./application/
RUN npm --prefix application ci --no-audit --no-fund

COPY backoffice/package.json backoffice/package-lock.json ./backoffice/
RUN npm --prefix backoffice ci --no-audit --no-fund

COPY application ./application
COPY backoffice ./backoffice
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000 3001
CMD ["./start.sh"]