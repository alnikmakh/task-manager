#!/bin/bash

MAX_RETRIES=30
RETRY_INTERVAL=5

echo "Waiting for MongoDB instances to be ready..."

for i in $(seq 1 $MAX_RETRIES); do
    if mongosh --host mongo1:27017 --eval "db.adminCommand('ping')" &>/dev/null && \
       mongosh --host mongo2:27017 --eval "db.adminCommand('ping')" &>/dev/null && \
       mongosh --host mongo3:27017 --eval "db.adminCommand('ping')" &>/dev/null; then
        echo "All MongoDB instances are ready."
        break
    fi
    echo "Waiting for MongoDB instances to be ready... Attempt $i/$MAX_RETRIES"
    sleep $RETRY_INTERVAL
done

if [ $i -eq $MAX_RETRIES ]; then
    echo "Timed out waiting for MongoDB instances to be ready."
    exit 1
fi

echo "Initiating replica set..."

mongosh --host mongo1:27017 <<EOF
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
})
EOF

tail -f /dev/null
