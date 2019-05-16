FROM node:8
WORKDIR /common
COPY ./apps/common/package.json /common
RUN npm install
COPY ./apps/common /common
RUN npm run build
WORKDIR /app/client
COPY ./apps/car_builder/client/package.json /app/client
RUN npm install -g cordova@8.0.0
RUN npm install
COPY ./apps/car_builder/client /app/client
RUN npm run build
WORKDIR /app/server
COPY ./apps/car_builder/server/package.json /app/server
RUN npm install
RUN npm rebuild
COPY ./apps/car_builder/server /app/server
RUN npm run build
CMD npm run start
EXPOSE 8100