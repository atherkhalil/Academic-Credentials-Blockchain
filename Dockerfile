FROM node:14

WORKDIR /app

COPY . .

EXPOSE 4444

CMD [ "node", "app.js"]
