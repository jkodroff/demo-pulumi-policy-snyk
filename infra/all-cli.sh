#!/bin/bash
clear
docker rmi -f $(docker images -a -q)
echo "FROM --platform=linux/amd64 alpine:latest" > GoodDockerfile
docker image build -f GoodDockerfile . -t docker.io/joshkodroff/snyk-policy-good-image
snyk container test docker.io/joshkodroff/snyk-policy-good-image # --file=GoodDockerfile