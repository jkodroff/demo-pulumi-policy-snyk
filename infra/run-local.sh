#!/bin/bash
clear
docker rmi -f $(docker images -a -q)
pulumi preview --policy-pack ../policy --policy-pack-config policy-config.json