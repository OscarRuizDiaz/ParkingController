# Etapa de construcción
FROM node:22-alpine AS build
WORKDIR /app

# Copiar archivos de configuración e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente y construir la aplicación
COPY . .

# Variables de entorno en tiempo de build (opcional)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar los archivos estáticos generados al servidor Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Sobrescribir la configuración de Nginx para soportar SPA routing y reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
