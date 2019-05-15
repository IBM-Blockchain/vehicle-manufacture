FROM node:8
WORKDIR /common
COPY ./apps/common/package.json /common
RUN npm install
COPY ./apps/common /common
RUN npm run build
WORKDIR /app
COPY ./apps/manufacturer/package.json /app
RUN npm install
RUN npm rebuild
COPY ./apps/manufacturer /app
RUN npm run build
CMD npm run start
EXPOSE 6001
