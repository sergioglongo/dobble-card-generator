# Etapa 1: Construcción
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json ./
# No copiamos lockfile si no existe o para evitar conflictos de versiones en este entorno
RUN npm install

# Copiar el resto del código
COPY . .

# Generar el bundle de producción
RUN npm run build

# Etapa 2: Servidor de producción
FROM nginx:stable-alpine

# Copiar los archivos compilados desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
