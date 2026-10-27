FROM node:18-alpine

WORKDIR /var/www/html

# Пустышка для флага
RUN echo "flag{dummy}" > /flag.txt

COPY package*.json ./
RUN npm init -y && npm install express
COPY . .

RUN chmod +x subscribe.sh

EXPOSE 80
CMD ["node", "app.js"]