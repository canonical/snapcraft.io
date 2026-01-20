# syntax=docker/dockerfile:experimental

# Build stage: Install python dependencies
# ===
FROM ubuntu:jammy AS python-dependencies
RUN apt-get update && apt-get install --no-install-recommends --yes python3-pip python3-setuptools
ADD requirements.txt /tmp/requirements.txt
RUN pip3 config set global.disable-pip-version-check true
RUN --mount=type=cache,target=/root/.cache/pip pip3 install --user --requirement /tmp/requirements.txt


# Build stage: Install yarn dependencies
# ===
FROM node:22 AS yarn-dependencies
WORKDIR /srv
ADD package.json .
ADD yarn.lock .
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn yarn install --production

# Build stage: Run "yarn run build"
# ===
FROM yarn-dependencies AS build
ADD static/js static/js
ADD static/sass static/sass
ADD vite.config.js .
ADD viteDetectImportPlugin.js .
ADD tsconfig.json .
ADD templates templates
RUN yarn install
RUN yarn run build

# Build the production image
# ===
FROM ubuntu:jammy

# Install python and import python dependencies
RUN apt-get update && apt-get install --no-install-recommends --yes python3-lib2to3 python3-setuptools python3-pkg-resources ca-certificates libsodium-dev
COPY --from=python-dependencies /root/.local/lib/python3.10/site-packages /root/.local/lib/python3.10/site-packages
COPY --from=python-dependencies /root/.local/bin /root/.local/bin
ENV PATH="/root/.local/bin:${PATH}"

# Set up environment
ENV LANG C.UTF-8
WORKDIR /srv

# Import code, build assets and mirror list
ADD . .
RUN rm -rf package.json yarn.lock .babelrc requirements.txt
COPY --from=build /srv/static/js static/js

# Setup commands to run server
ENTRYPOINT ["./entrypoint"]
CMD ["0.0.0.0:80"]

