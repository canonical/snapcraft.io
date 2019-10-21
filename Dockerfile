FROM ubuntu:bionic

# Set up environment
ENV LANG C.UTF-8
WORKDIR /srv

# System dependencies
RUN apt-get update && apt-get install --no-install-recommends --yes python3 python3-setuptools python3-pip libsodium-dev

# Import code, install code dependencies
ADD . .
RUN python3 -m pip install --no-cache-dir -r requirements.txt

# Set git commit ID
ARG COMMIT_ID
RUN echo "${COMMIT_ID}" > version-info.txt
ENV COMMIT_ID "${COMMIT_ID}"

# Set which webapp configuration to load
ARG WEBAPP=snapcraft
ENV WEBAPP "${WEBAPP}"

# Setup commands to run server
ENTRYPOINT ["./entrypoint"]
CMD ["0.0.0.0:80"]

