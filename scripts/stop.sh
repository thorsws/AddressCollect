#!/bin/bash

# Stop script for Address Collection Campaign System
# This script gracefully stops the Next.js dev server

set -e

echo "🛑 Stopping Address Collection Campaign System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill process on port
kill_port() {
  local port=$1
  local pids=$(lsof -ti:$port 2>/dev/null)

  if [ -z "$pids" ]; then
    return 1
  fi

  echo "Found process(es) on port $port: $pids"

  # Try graceful shutdown first (SIGTERM)
  echo "Sending SIGTERM..."
  echo "$pids" | xargs kill -15 2>/dev/null || true

  # Wait up to 5 seconds for graceful shutdown
  for i in {1..5}; do
    if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo -e "${GREEN}✅ Process stopped gracefully${NC}"
      return 0
    fi
    sleep 1
  done

  # Force kill if still running (SIGKILL)
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Graceful shutdown failed, forcing kill..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1

    if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo -e "${GREEN}✅ Process forcefully stopped${NC}"
      return 0
    else
      echo -e "${RED}❌ Failed to stop process${NC}"
      return 1
    fi
  fi
}

# Check if PID file exists
if [ -f .dev-server.pid ]; then
  PID=$(cat .dev-server.pid)
  echo "Found PID file: $PID"

  if ps -p $PID > /dev/null 2>&1; then
    echo "Stopping process $PID..."
    kill -15 $PID 2>/dev/null || true

    # Wait for process to stop
    for i in {1..5}; do
      if ! ps -p $PID > /dev/null 2>&1; then
        break
      fi
      sleep 1
    done

    # Force kill if still running
    if ps -p $PID > /dev/null 2>&1; then
      kill -9 $PID 2>/dev/null || true
    fi
  fi

  rm .dev-server.pid
fi

# Kill any process on port 3000
echo ""
echo "Checking port 3000..."
if kill_port 3000; then
  echo ""
else
  echo -e "${YELLOW}⚠️  No process found on port 3000${NC}"
  echo ""
fi

# Kill any node processes running Next.js
echo "Checking for Next.js processes..."
NEXT_PIDS=$(ps aux | grep '[n]ext dev' | awk '{print $2}')

if [ -n "$NEXT_PIDS" ]; then
  echo "Found Next.js dev processes: $NEXT_PIDS"
  echo "$NEXT_PIDS" | xargs kill -15 2>/dev/null || true
  sleep 2

  # Force kill if still running
  NEXT_PIDS=$(ps aux | grep '[n]ext dev' | awk '{print $2}')
  if [ -n "$NEXT_PIDS" ]; then
    echo "$NEXT_PIDS" | xargs kill -9 2>/dev/null || true
  fi

  echo -e "${GREEN}✅ Next.js processes stopped${NC}"
else
  echo "No Next.js dev processes found"
fi

echo ""
echo -e "${GREEN}✨ Application stopped successfully${NC}"
