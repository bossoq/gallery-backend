FROM node:16.20.2-buster-slim

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

COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile --no-cache --prefer-offline

COPY /src ./src
COPY /prisma ./prisma
COPY startup.sh ./
RUN chmod +x startup.sh

EXPOSE ${PORT}

CMD ["./startup.sh"]
