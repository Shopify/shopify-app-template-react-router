#!/bin/sh

# Start Cloud SQL Proxy in background
/cloud-sql-proxy --port 5432 ${INSTANCE_CONNECTION_NAME} &

# Wait for proxy to be ready
sleep 3

# Run production setup and start app
npm run setup:prod && npm run start

