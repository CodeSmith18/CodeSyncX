FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
  bash \
  coreutils \
  g++ \
  openjdk-17-jdk \
  python3 \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash runner

WORKDIR /workspace

USER runner
