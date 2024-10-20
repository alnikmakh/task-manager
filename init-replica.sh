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

echo "Checking replica set status..."

REPLICA_STATUS=$(mongosh --host mongo1:27017 --quiet --eval "rs.status().ok")

if [ "$REPLICA_STATUS" == "1" ]; then
    echo "Replica set is already initialized. Checking if all members are present..."
    MEMBER_COUNT=$(mongosh --host mongo1:27017 --quiet --eval "rs.status().members.length")
    if [ "$MEMBER_COUNT" == "3" ]; then
        echo "All members are present in the replica set. No action needed."
    else
        echo "Replica set is initialized but doesn't have all members. Reconfiguring..."
        mongosh --host mongo1:27017 <<EOF
        rs.reconfig({
          _id: "rs0",
          members: [
            { _id: 0, host: "mongo1:27017" },
            { _id: 1, host: "mongo2:27017" },
            { _id: 2, host: "mongo3:27017" }
          ]
        }, {force: true})
EOF
    fi
else
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
fi

echo "Waiting for replica set to stabilize..."
sleep 10

echo "Replica set setup completed."
tail -f /dev/null