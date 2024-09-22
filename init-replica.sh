#!/bin/bash

echo "Waiting for MongoDB instances to be ready..."

# Wait for mongo1 to be ready
until mongosh --host localhost:27017 --eval "print(\"waited for connection\")"
do
    sleep 2
done

# Wait for mongo2 to be ready
until mongosh --host mongo2:27018 --eval "print(\"waited for connection\")"
do
    sleep 2
done

# Wait for mongo3 to be ready
until mongosh --host mongo3:27019 --eval "print(\"waited for connection\")"
do
    sleep 2
done

echo "All MongoDB instances are up. Initiating replica set..."

# Initiate the replica set
mongosh --host localhost:27017 <<EOF
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27018" },
    { _id: 2, host: "mongo3:27019" }
  ]
})
EOF

echo "Replica set initiated."