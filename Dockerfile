FROM node:20.9

USER node
WORKDIR /home/node

RUN mkdir app

WORKDIR /home/node/app

COPY . .

ENTRYPOINT ["node", "server"]

EXPOSE 2000