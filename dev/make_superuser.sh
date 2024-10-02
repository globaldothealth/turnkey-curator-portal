# Run this script from anywhere and pass it an email as first argument to make
# that user a super user with all roles assigned to it.
#!/bin/bash
set -e
# Store current directory.
pushd `pwd`
# We have to run docker-compose from this directory for it to pick up the .env file.
cd `dirname "$0"`

# Pass database name as the first parameter
DB="${GDH_DATABASE:-$1}"
# Pass email of user to grant an admin role as second parameter
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec mongo mongosh "${DB}" --eval "var email='$2'; var roles=['admin', 'curator'];" /verification/scripts/roles.js
# Restore directory.
popd