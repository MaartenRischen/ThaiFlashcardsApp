#!/bin/bash

echo "Thai Flashcards App - Restore to Working Version (aug28working)"
echo "=============================================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository!"
    exit 1
fi

# Show current branch and status
echo "Current branch: $(git branch --show-current)"
echo "Current commit: $(git rev-parse --short HEAD)"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "Warning: You have uncommitted changes!"
    echo "Please commit or stash your changes before restoring."
    echo ""
    echo "To stash changes: git stash"
    echo "To commit changes: git add . && git commit -m 'your message'"
    exit 1
fi

echo "This will restore the codebase to the aug28working version."
echo "All features were confirmed working at this point."
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoring to aug28working..."
    
    # Checkout the tag
    git checkout aug28working
    
    echo ""
    echo "✅ Successfully restored to aug28working version!"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm install"
    echo "2. Ensure your .env file has all required variables"
    echo "3. Run: npm run dev (for local development)"
    echo ""
    echo "To create a new branch from this version:"
    echo "git checkout -b your-new-branch-name"
else
    echo "Restore cancelled."
fi
