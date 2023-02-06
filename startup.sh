#! /bin/sh
hookdeck listen 8080 stripe &
hookdeck listen 8080 twitch & 
hookdeck listen 8080 ko-fi &
node index.mjs
