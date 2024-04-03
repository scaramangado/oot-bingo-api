#!/bin/bash

git pull
(cd deployment \
  && docker compose build --pull \
  && docker compose up -d)
