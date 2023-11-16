FROM node:14.17.0-alpine
WORKDIR ./app
ADD package*.json ./
RUN npm install
COPY . /app
EXPOSE 3000
CMD [ "npm", "start"]
