#!/bin/bash

# Script to rename the project directory and update references

# Define the current and new directory names
OLD_DIR="investsafe-shield-main"
NEW_DIR="safelens"

# Get the parent directory path
PARENT_DIR=$(dirname "$(pwd)")
OLD_PATH="$PARENT_DIR/$OLD_DIR"
NEW_PATH="$PARENT_DIR/$NEW_DIR"

# Rename the directory
echo "Renaming project directory from $OLD_DIR to $NEW_DIR..."
mv "$OLD_PATH" "$NEW_PATH"

# Navigate to the new directory
cd "$NEW_PATH" || exit

echo "Project has been renamed to SafeLens!"
echo "New project path: $NEW_PATH"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' in the project root"
echo "2. Navigate to the frontend and backend directories and run 'npm install' in each"
echo "3. Start the development servers with 'npm run dev' in the project root"
