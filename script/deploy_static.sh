#!/usr/bin/env sh

# abort on errors
set -e

# build
yarn build:static

# navigate into the build output directory
cd static

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io/<REPO>
git push -f https://github.com/fabienwnklr/free-drawing-demo.git master

cd -
