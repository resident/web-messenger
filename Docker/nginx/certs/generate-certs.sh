#!/bin/bash

crt="/etc/nginx/certs/server.crt"
key="/etc/nginx/certs/server.key"

if [[ ! -f $crt || ! -f $key ]]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout $key -out $crt \
     -subj "/C=US/ST=California/L=San Francisco/O=Web Messenger/OU=IT Department/CN=web-messenger.local"
fi
