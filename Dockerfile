FROM node:20-slim AS frontend-builder

WORKDIR /app

COPY src/web/package*.json ./
RUN npm install

COPY src/web ./
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --from=frontend-builder /app/dist /dist

COPY certs/key.pem /key.pem
COPY certs/cert.pem /cert.pem

COPY . .

EXPOSE 443

CMD ["python", "src/scripts/server.py"]
