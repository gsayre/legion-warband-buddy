#!/bin/bash
set -e

# Get jj status and diff
STATUS=$(jj status 2>/dev/null)
DIFF=$(jj diff 2>/dev/null)

if [ -z "$DIFF" ]; then
    echo "No changes to commit"
    exit 0
fi

# Generate commit message using Claude Code CLI
echo "Generating commit message..."
COMMIT_MSG=$(echo "Based on these changes, write a single concise commit message (one line, no quotes, imperative mood, max 72 chars):

Status:
$STATUS

Diff:
$DIFF" | claude -p --output-format text)

# Clean up the message (remove any leading/trailing whitespace)
COMMIT_MSG=$(echo "$COMMIT_MSG" | tr -d '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

echo "Commit message: $COMMIT_MSG"

# Set the description
jj desc -m "$COMMIT_MSG"

# Move main bookmark to current revision
jj bookmark set main

# Push to remote
jj git push

echo "Done! Changes pushed with message: $COMMIT_MSG"
