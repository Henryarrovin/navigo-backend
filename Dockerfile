FROM oven/bun:latest AS build

WORKDIR /app

COPY bun.lock . 
COPY package.json .

RUN bun install --frozen-lockfile

COPY . .

RUN bun build ./index.ts --compile --outfile cli

FROM ubuntu:22.04

WORKDIR /app

COPY --from=build /app/cli /app/cli

EXPOSE 8080

CMD ["/app/cli"]