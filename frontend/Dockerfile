# frontend/Dockerfile

# --- Giai đoạn 1: Build React ra file tĩnh (HTML/CSS/JS) ---
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build ra thư mục 'build'
RUN npm run build

# --- Giai đoạn 2: Dùng Nginx để chạy web ---
FROM nginx:alpine
# Copy file build từ giai đoạn 1 sang thư mục của Nginx
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy cấu hình Nginx (để sửa lỗi refresh trang bị 404)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]