FROM node as build

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
COPY patches ./patches

RUN yarn

COPY . ./

ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL:-"https://api.smarkets.com"}

RUN yarn build

FROM nginx:stable

COPY --from=build /usr/src/app/build /usr/share/nginx/html

CMD nginx -g "daemon off;"
