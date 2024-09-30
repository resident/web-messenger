#!/bin/bash

composer_update=0
npm_update=0

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --composer-update) composer_update=1; shift ;;
        --npm-update) npm_update=1; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

cd /mnt/app || exit

php artisan down

if [[ "$composer_update" -eq 1 ]]; then
    composer update --no-interaction --prefer-dist
fi

php artisan migrate
php artisan cache:clear
php artisan auth:clear-resets
php artisan optimize:clear

php artisan reverb:start --debug > deploy/logs/reverb.log 2>&1 &
php artisan queue:listen > deploy/logs/queue.log 2>&1 &
php artisan schedule:work > deploy/logs/schedule.log 2>&1 &

if [[ "$npm_update" -eq 1 ]]; then
    npm update
fi

npm run dev > deploy/logs/npm_run_dev.log 2>&1 &

php artisan up
