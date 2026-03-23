FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Đây là dòng lệnh quan trọng nhất để báo Docker biết cần mở cổng mạng 3000
EXPOSE 3000

# Lệnh này yêu cầu Docker chạy file server.js khi container khởi động
CMD ["node", "server.js"]