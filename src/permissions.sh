#!/bin/bash

function set_write_permission {
    for dir in "$1"/*; do
        if [ -d "$dir" ]; then
            chmod o+w "$dir"
            echo "Add write permission to: $dir"

            set_write_permission "$dir"
        fi
    done
}

set_write_permission "/var/www/html/storage"
