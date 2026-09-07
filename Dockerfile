FROM node:20.20.1

WORKDIR /app
COPY . .

RUN rm -rf node_modules && npm ci && npm run build && npm run compress:brotli
#RUN npm run compress:gzip

WORKDIR /app/dist
COPY assets/MDO/client-assets/dist www/en/assets
RUN npm install --production
EXPOSE 3004

CMD [ "npm", "run", "serve:prod" ]
