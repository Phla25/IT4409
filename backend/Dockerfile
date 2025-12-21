# backend/Dockerfile

# 1. Dùng Node.js bản nhẹ (Alpine)
FROM node:18-alpine

# 2. Tạo thư mục làm việc trong container
WORKDIR /app

# 3. Copy file package để cài thư viện trước (Tối ưu cache)
COPY package*.json ./

# 4. Cài đặt thư viện
RUN npm install

# 5. Copy toàn bộ code vào
COPY . .

# 6. Mở cổng 5000 (Cổng server của bạn)
EXPOSE 5000

# 7. Lệnh chạy server
CMD ["node", "server.js"]