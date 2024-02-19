FROM node:18-buster-slim

WORKDIR /app

ENV NODE_ENV production
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ARG DIRECTORY
ENV DIRECTORY=${DIRECTORY}
ARG HOST
ENV HOST=${HOST}
ARG PORT
ENV PORT=${PORT}

RUN echo "deb http://ftp.debianclub.org/debian buster main" > /etc/apt/sources.list && \
    echo "deb http://ftp.debianclub.org/debian-security buster/updates main" >> /etc/apt/sources.list && \
    echo "deb http://ftp.debianclub.org/debian buster-updates main" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y libtool-bin build-essential python3 openssl

COPY package.json yarn.lock tsconfig.json ./
RUN mkdir -p /app/caches

RUN yarn set version berry
RUN yarn install --production=false

COPY /src ./src
COPY /prisma ./prisma
COPY init_start.sh app_start.sh ./
RUN chmod +x init_start.sh app_start.sh

EXPOSE ${PORT}

CMD ["./app_start.sh"]
