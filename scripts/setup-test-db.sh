#!/bin/bash

# Setup script for test database
# This script helps set up a test database for running integration tests

set -e

echo "Setting up test database..."

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "Error: MySQL client is not installed"
    echo "Please install MySQL client or use Docker"
    exit 1
fi

# Default values
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-3306}"
DB_USER="${DATABASE_USER:-root}"
DB_PASSWORD="${DATABASE_PASSWORD:-}"
DB_NAME="${DATABASE_NAME:-test_image_evaluation}"
TEST_USER="${TEST_DB_USER:-test}"
TEST_PASSWORD="${TEST_DB_PASSWORD:-test}"

echo "Database configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  Test User: $TEST_USER"

# Create database
echo "Creating database..."
if [ -z "$DB_PASSWORD" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
fi

# Create test user
echo "Creating test user..."
if [ -z "$DB_PASSWORD" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" <<EOF
CREATE USER IF NOT EXISTS '$TEST_USER'@'localhost' IDENTIFIED BY '$TEST_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$TEST_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" <<EOF
CREATE USER IF NOT EXISTS '$TEST_USER'@'localhost' IDENTIFIED BY '$TEST_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$TEST_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
fi

echo "Test database setup complete!"
echo ""
echo "To run integration tests, set the following environment variables:"
echo "  export DATABASE_TEST_ENABLED=true"
echo "  export DATABASE_HOST=$DB_HOST"
echo "  export DATABASE_PORT=$DB_PORT"
echo "  export DATABASE_USER=$TEST_USER"
echo "  export DATABASE_PASSWORD=$TEST_PASSWORD"
echo "  export DATABASE_NAME=$DB_NAME"
echo ""
echo "Then run: pnpm test tests/integration"
