# syntax=docker/dockerfile:experimental

# Build stage: Install python dependencies
# ===
FROM ubuntu:focal AS python-dependencies
RUN apt-get update && apt-get install --no-install-recommends --yes python3-pip python3-setuptools git
ADD requirements.txt /tmp/requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip pip3 install --user --requirement /tmp/requirements.txt


# Build stage: Install yarn dependencies
# ===
FROM node:12-slim AS yarn-dependencies
WORKDIR /srv
ADD package.json yarn.lock .
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn yarn install


# Build stage: Run "yarn run build-css"
# ===
FROM yarn-dependencies AS build-css
ADD static/sass static/sass
RUN yarn run build-css

# Build stage: Run "yarn run build-js"
# ===
FROM yarn-dependencies AS build-js
WORKDIR /srv
ADD . .
RUN yarn run build-js

# Build the production image
# ===
FROM ubuntu:focal

# Install python and import python dependencies
RUN apt-get update && apt-get install --no-install-recommends --yes python3-lib2to3 python3-setuptools python3-pkg-resources ca-certificates libsodium-dev
COPY --from=python-dependencies /root/.local/lib/python3.8/site-packages /root/.local/lib/python3.8/site-packages
COPY --from=python-dependencies /root/.local/bin /root/.local/bin
ENV PATH="/root/.local/bin:${PATH}"

# Set up environment
ENV LANG C.UTF-8
WORKDIR /srv

# Import code, build assets and mirror list
ADD . .
RUN rm -rf package.json yarn.lock .babelrc webpack.config.js requirements.txt
COPY --from=build-css /srv/static/css static/css
COPY --from=build-js /srv/static/js static/js

# Set revision ID
ARG BUILD_ID
ENV TALISKER_REVISION_ID "${BUILD_ID}"

# Setup commands to run server
ENTRYPOINT ["./entrypoint"]
CMD ["0.0.0.0:80"]

