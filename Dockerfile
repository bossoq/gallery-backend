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

# buster is EOL; its packages now live on archive.debian.org (Release files are
# expired, hence Check-Valid-Until=false). Build deps are all in buster main.
RUN printf 'deb http://archive.debian.org/debian buster main\ndeb http://archive.debian.org/debian-security buster/updates main\ndeb http://archive.debian.org/debian buster-updates main\n' > /etc/apt/sources.list && \
    apt-get -o Acquire::Check-Valid-Until=false update && \
    apt-get install -y --no-install-recommends libtool-bin build-essential python3 openssl && \
    rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock tsconfig.json ./
RUN mkdir -p /app/caches

RUN yarn install --production=false

COPY /src ./src
COPY /prisma ./prisma
COPY init_start.sh app_start.sh ./
RUN chmod +x init_start.sh app_start.sh

EXPOSE ${PORT}

CMD ["./app_start.sh"]
