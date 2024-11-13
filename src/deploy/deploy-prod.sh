cd /mnt/app || exit

php artisan down

composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

php artisan migrate
php artisan cache:clear
php artisan auth:clear-resets
php artisan optimize:clear
php artisan optimize

php artisan storage:link --force

php artisan reverb:start > deploy/logs/reverb.log 2>&1 &
php artisan queue:listen > deploy/logs/queue.log 2>&1 &
php artisan schedule:work > deploy/logs/schedule.log 2>&1 &

npm install
npm run build > deploy/logs/npm_run_build.log 2>&1 &

php artisan up
