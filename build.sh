#!/bin/bash

# Build script with Node version check
echo "🔧 Building WYSIWYG Editor Library..."
echo ""

# Check if nvm is available
if command -v nvm &> /dev/null; then
    echo "✓ NVM found"
    echo "📦 Switching to Node 20..."
    
    # Source nvm to make it available in this script
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    nvm use 20
    echo ""
else
    echo "⚠️  NVM not found. Please ensure you're using Node.js 20+"
    echo "Current Node version:"
    node --version
    echo ""
fi

# Run the build
echo "🏗️  Building library..."
npm run build:lib

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📦 Library built in: dist/bigldeger-wysiwyg-editor"
else
    echo ""
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
