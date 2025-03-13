FROM node:18

WORKDIR /app
COPY . .

#RUN npm i yarn
#RUN yarn global add @angular/cli@latest

# Clean the yarn cache and install dependencies
RUN yarn cache clean && yarn install

RUN yarn && \
    yarn add moment vis-util && \
    yarn add @sunbird-cb/collection@^1.0.46-ang-9-12 \
             @sunbird-cb/design-system@0.0.1 \
             @sunbird-cb/resolver@^1.0.0-ang-9-12 \
             @sunbird-cb/utils@^1.0.19-ang-13-16

# Install missing dependency
RUN yarn add ajv-formats --save-dev

# Set memory limit to prevent crashes during build
ENV NODE_OPTIONS="--max_old_space_size=8192"

# Run Angular production build with optimized configuration
RUN npm run build -- --configuration production --outputPath=dist/www/en --baseHref=/

RUN npm run compress:brotli

# RUN yarn && yarn add moment && yarn add vis-util && npm run build --prod --build-optimizer
#RUN ng build --prod --outputPath=dist/www/en --baseHref=/ --i18nLocale=en --verbose=true
# RUN npm run compress:brotli
#RUN npm run compress:gzip

WORKDIR /app/dist
COPY assets/MDO/client-assets/dist www/en/assets
RUN npm install --production
EXPOSE 3004

CMD [ "npm", "run", "serve:prod" ]
