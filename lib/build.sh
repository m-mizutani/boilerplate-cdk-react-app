#!/bin/bash

ASSET_DIR=/asset-output
npm i -g npm
cd lambda && npm i && npm exec tsc && cd ..
cd frontend && npm i && npm exec webpack && cd ..
cp -rp lambda $ASSET_DIR
cp -rp frontend/dist $ASSET_DIR/assets
