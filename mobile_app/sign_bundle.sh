#!/usr/bin/env bash
set -e

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

TARGET_FILE="$1"

if [ -z "$TARGET_FILE" ]; then
    # Default to Embroidex.aab if exists
    if [ -f "Embroidex.aab" ]; then
        TARGET_FILE="Embroidex.aab"
    else
        echo -e "${RED}Usage: ./sign_bundle.sh <path-to-aab-or-apk>${NC}"
        echo -e "Example: ./sign_bundle.sh Embroidex.aab"
        exit 1
    fi
fi

if [ ! -f "$TARGET_FILE" ]; then
    echo -e "${RED}Error: Target file '$TARGET_FILE' does not exist!${NC}"
    exit 1
fi

KEY_PROPERTIES="$SCRIPT_DIR/android/key.properties"

if [ ! -f "$KEY_PROPERTIES" ]; then
    echo -e "${RED}Error: 'android/key.properties' not found!${NC}"
    echo -e "Please run ${CYAN}./generate_keystore.sh${NC} first to generate your release keystore."
    exit 1
fi

# Parse key.properties
STORE_FILE=$(grep -E '^\s*storeFile\s*=' "$KEY_PROPERTIES" | awk -F'=' '{print $2}' | tr -d ' \r\n')
STORE_PASSWORD=$(grep -E '^\s*storePassword\s*=' "$KEY_PROPERTIES" | awk -F'=' '{print $2}' | tr -d ' \r\n')
KEY_ALIAS=$(grep -E '^\s*keyAlias\s*=' "$KEY_PROPERTIES" | awk -F'=' '{print $2}' | tr -d ' \r\n')
KEY_PASSWORD=$(grep -E '^\s*keyPassword\s*=' "$KEY_PROPERTIES" | awk -F'=' '{print $2}' | tr -d ' \r\n')
KEY_PASSWORD="${KEY_PASSWORD:-$STORE_PASSWORD}"

# Resolve keystore path
if [ -f "$SCRIPT_DIR/android/app/$STORE_FILE" ]; then
    RESOLVED_KEYSTORE="$SCRIPT_DIR/android/app/$STORE_FILE"
elif [ -f "$SCRIPT_DIR/android/$STORE_FILE" ]; then
    RESOLVED_KEYSTORE="$SCRIPT_DIR/android/$STORE_FILE"
elif [ -f "$STORE_FILE" ]; then
    RESOLVED_KEYSTORE="$STORE_FILE"
else
    echo -e "${RED}Error: Keystore file '$STORE_FILE' could not be found in android/app/ or android/!${NC}"
    exit 1
fi

echo -e "${BLUE}====================================================${NC}"
echo -e "${BOLD}${BLUE}       Signing Binary with jarsigner               ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "Target File   : ${CYAN}$TARGET_FILE${NC}"
echo -e "Keystore File : ${CYAN}$RESOLVED_KEYSTORE${NC}"
echo -e "Key Alias     : ${CYAN}$KEY_ALIAS${NC}"
echo ""

echo -e "${YELLOW}➔ Signing file...${NC}"
jarsigner -verbose \
    -sigalg SHA256withRSA \
    -digestalg SHA-256 \
    -keystore "$RESOLVED_KEYSTORE" \
    -storepass "$STORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    "$TARGET_FILE" \
    "$KEY_ALIAS"

echo ""
echo -e "${YELLOW}➔ Verifying signature...${NC}"
jarsigner -verify -verbose -certs "$TARGET_FILE" | grep -E "CN=" | head -n 1 || true

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✓ SUCCESSFULLY SIGNED: $TARGET_FILE               ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "This file is signed and ready for Google Play Console."
echo ""
