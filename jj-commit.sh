#!/bin/bash
set -e

# Get jj status and diff
STATUS=$(jj status 2>/dev/null)
DIFF=$(jj diff 2>/dev/null)

if [ -z "$DIFF" ]; then
    echo "No changes to commit"
    exit 0
fi

# Check if any Convex files have changes
CONVEX_CHANGES=$(jj diff --summary 2>/dev/null | rg '^[AMD]\s+convex/' || true)

if [ -n "$CONVEX_CHANGES" ]; then
    echo "Convex files changed:"
    echo "$CONVEX_CHANGES"
    echo ""
    echo "Running Convex deploy..."

    # Run deploy and capture output/errors
    if ! DEPLOY_OUTPUT=$(bunx convex deploy -y 2>&1); then
        echo ""
        echo "❌ Convex deploy failed! Push aborted."
        echo ""
        echo "Deploy errors:"
        echo "$DEPLOY_OUTPUT"
        exit 1
    fi

    echo "✓ Convex deploy successful"
    echo ""
fi

# Generate commit message using Claude Code CLI
echo "Generating commit message..."
COMMIT_MSG=$(echo "You are a commit message generator. Output ONLY the commit message itself - no explanation, no preamble, no quotes. One line, imperative mood, max 72 chars.

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

echo ""
echo "✓ Done! Changes pushed with message: $COMMIT_MSG"
