#!/usr/bin/env sh

# abort on errors
set -e

rm -rf docs/.vitepress/dist
# build
yarn docs:build

# navigate into the build output directory
cd docs/.vitepress/dist

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init --initial-branch=master
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io/<REPO>
git push -f https://github.com/fabienwnklr/free-drawing-docs.git master

cd -
