cd /mnt/app || exit

php artisan down

composer update --no-interaction --prefer-dist --optimize-autoloader --no-dev

php artisan migrate
php artisan cache:clear
php artisan auth:clear-resets
php artisan optimize:clear
php artisan optimize

php artisan storage:link --force

php artisan reverb:start > deploy/logs/reverb.log 2>&1 &
php artisan queue:listen > deploy/logs/queue.log 2>&1 &
php artisan schedule:work > deploy/logs/schedule.log 2>&1 &

npm update
npm run build

php artisan up
