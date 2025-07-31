#!/bin/bash

# Start the demo server
echo "Starting demo server..."
cd demos && python3 -m http.server 8888 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Run E2E tests
echo "Running E2E tests..."
cd .. && npx playwright test "$@"

# Capture test result
TEST_RESULT=$?

# Kill the server
echo "Stopping demo server..."
kill $SERVER_PID

# Exit with test result
exit $TEST_RESULT