# Етап 1: Збірка React додатка
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Етап 2: Запуск на Nginx
FROM nginx:1.25-alpine
# Копіюємо зібраний фронтенд у папку Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Копіюємо кастомний конфіг Nginx (потрібен для SPA маршрутизації)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]