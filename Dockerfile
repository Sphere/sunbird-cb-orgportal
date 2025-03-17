FROM node:18.20.3

WORKDIR /app
COPY . .

#RUN npm i yarn
#RUN yarn global add @angular/cli@latest
# RUN rm -rf package-lock.json node_modules
# Clean the yarn cache and install dependencies
# RUN yarn cache clean && yarn install
# RUN npm cache clean --force

# Install Angular CLI globally (Version 12)
RUN npm install -g @angular/cli@16.2.12

# Install correct version of @angular-devkit/build-ng-packagr
RUN npm install @angular-devkit/build-ng-packagr@^0.1002.4 --save-dev --legacy-peer-deps
# RUN npm install express-static-gzip --save --legacy-peer-deps

RUN npm install --legacy-peer-deps
RUN npm install connect-timeout --legacy-peer-deps
RUN npm install morgan --save --legacy-peer-deps



RUN npm install moment vis-util --legacy-peer-deps
RUN npm install @sunbird-cb/collection@^1.0.53-ang-13-16 --legacy-peer-deps
RUN npm install @sunbird-cb/resolver@^1.0.0-ang-13-16 --legacy-peer-deps
RUN npm install @sunbird-cb/utils@^1.0.21-ang-13-16 --legacy-peer-deps

# # Install missing dependency
# RUN npm install ajv-formats --save-dev --legacy-peer-deps

# Set memory limit to prevent crashes during build
ENV NODE_OPTIONS="--max_old_space_size=8192"

# Run Angular production build with optimized configuration
RUN npm run build -- --configuration production --output-path=dist/www/en

RUN npm run compress:brotli

# RUN yarn && yarn add moment && yarn add vis-util && npm run build --prod --build-optimizer
#RUN ng build --prod --outputPath=dist/www/en --baseHref=/ --i18nLocale=en --verbose=true
# RUN npm run compress:brotli
#RUN npm run compress:gzip

WORKDIR /app/dist
COPY assets/MDO/client-assets/dist www/en/assets
# RUN npm install --production

# Install production dependencies only
# RUN npm install --omit=dev --legacy-peer-deps
EXPOSE 3004

CMD [ "npm", "run", "serve:prod" ]
