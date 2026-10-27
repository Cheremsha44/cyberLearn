FROM node:18-alpine

WORKDIR /var/www/html

# Пустышка для флага
RUN echo "flag{dummy}" > /flag.txt

COPY package*.json ./
RUN npm init -y && npm install express
COPY . .

# Даем права на запись в папку public, чтобы хакер мог туда сохранить вывод команды
RUN chmod 777 public

EXPOSE 80
CMD ["node", "app.js"]