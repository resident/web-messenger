cd /mnt/app || exit

php artisan down

composer update --no-interaction --prefer-dist

php artisan migrate
php artisan cache:clear
php artisan auth:clear-resets
php artisan optimize:clear

php artisan reverb:start --debug > deploy/logs/reverb.log 2>&1 &
php artisan queue:listen > deploy/logs/queue.log 2>&1 &
php artisan schedule:work > deploy/logs/schedule.log 2>&1 &

npm update
npm run dev > deploy/logs/npm_run_dev.log 2>&1 &

php artisan up
