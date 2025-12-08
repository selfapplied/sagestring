#!/bin/bash
# Publish to GitHub using gh CLI

set -e

echo "🚀 Preparing to publish to GitHub..."

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Install with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔐 Authenticating with GitHub..."
    gh auth login
fi

# Check current branch
BRANCH=$(git branch --show-current)
echo " branch: $BRANCH"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Uncommitted changes detected"
    read -p "Commit changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "Reorganize: move demos to demo/, docs to docs/, rename files"
    fi
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin $BRANCH

echo "✅ Published to GitHub!"
echo "🌐 View at: $(gh repo view --web)"

