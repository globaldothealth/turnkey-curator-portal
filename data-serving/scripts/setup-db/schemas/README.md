# Mongodb schema validators

Database schema is up to date with:
https://github.com/globaldothealth/outbreak-schema/tree/ad356b10cf30e012f7f8d6ccc7fbf43fc96e8b82

This directory contains schema validators and index files for the various collections stored in mongodb.
These are the _initial_ state of the database: do not make changes here, as they won't make any difference in production!
Modifications are made via migrations: every new change requires a new migration. See the `migrations` folder for more information.
