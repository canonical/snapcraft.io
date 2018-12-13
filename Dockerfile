FROM ubuntu:bionic
# this is a stupid PR

# Set up environment
ENV LANG C.UTF-8
WORKDIR /srv

# System dependencies
RUN apt-get update && apt-get install --yes python3-pip libsodium-dev

# Import code, install code dependencies
ADD . .
RUN pip3 install -r requirements.txt

# Set git commit ID
ARG COMMIT_ID
RUN test -n "${COMMIT_ID}"
RUN echo "${COMMIT_ID}" > version-info.txt
ENV COMMIT_ID "${COMMIT_ID}"

# Set which webapp configuration to load
ARG WEBAPP=snapcraft
ENV WEBAPP "${WEBAPP}"

# Setup commands to run server
ENTRYPOINT ["./entrypoint"]
CMD ["0.0.0.0:80"]

