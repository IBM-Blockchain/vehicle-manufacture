FROM node:8
WORKDIR /wallet-api
COPY ./wallet-api/package.json /wallet-api
RUN npm install
COPY ./wallet-api /wallet-api
RUN npm run build
WORKDIR /common
COPY ./apps/common/package.json /common
RUN npm install
COPY ./apps/common /common
RUN npm run build
WORKDIR /app
COPY ./apps/manufacturer/package.json /app
RUN npm install
COPY ./apps/manufacturer /app
RUN npm run build
CMD npm run start
EXPOSE 6001
