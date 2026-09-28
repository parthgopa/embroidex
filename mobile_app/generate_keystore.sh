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

echo -e "${BLUE}====================================================${NC}"
echo -e "${BOLD}${BLUE}   Embroidex - Android Release Keystore Generator   ${NC}"
echo -e "${BLUE}====================================================${NC}"

# Navigate to mobile_app root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

KEYSTORE_DIR="$SCRIPT_DIR/android/app"
KEYSTORE_NAME="embroidex-upload-key.keystore"
KEYSTORE_PATH="$KEYSTORE_DIR/$KEYSTORE_NAME"
KEY_PROPERTIES_PATH="$SCRIPT_DIR/android/key.properties"
KEY_ALIAS="embroidex-key-alias"

# Check if keystore already exists
if [ -f "$KEYSTORE_PATH" ]; then
    echo -e "${YELLOW}Warning: A keystore already exists at:${NC}"
    echo -e "  $KEYSTORE_PATH"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " OVERWRITE
    if [[ ! "$OVERWRITE" =~ ^[yY]$ ]]; then
        echo -e "${CYAN}Keystore generation cancelled. Existing keystore preserved.${NC}"
        exit 0
    fi
    echo ""
fi

# Prompt for password if not passed as environment variable
if [ -z "$KEYSTORE_PASSWORD" ]; then
    echo -e "Enter a password to protect your release keystore (min 6 characters)."
    read -s -p "Password: " KEYSTORE_PASSWORD
    echo ""
    read -s -p "Confirm Password: " KEYSTORE_PASSWORD_CONFIRM
    echo ""
    
    if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}Error: Passwords do not match!${NC}"
        exit 1
    fi
    
    if [ ${#KEYSTORE_PASSWORD} -lt 6 ]; then
        echo -e "${RED}Error: Password must be at least 6 characters long.${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}➔ Generating RSA 2048-bit PKCS12 release keystore...${NC}"

# Generate the keystore
keytool -genkeypair -v -storetype PKCS12 \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEYSTORE_PASSWORD" \
    -dname "CN=Embroidex, OU=Mobile, O=Embroidex, L=Surat, ST=Gujarat, C=IN"

echo -e "${GREEN}✓ Keystore file generated at:${NC} $KEYSTORE_PATH"

# Write key.properties
echo -e "${YELLOW}➔ Writing android/key.properties...${NC}"
cat <<EOF > "$KEY_PROPERTIES_PATH"
# ====================================================================
# Embroidex - Android Release Signing Configuration (key.properties)
# ====================================================================
# IMPORTANT: This file is GIT-IGNORED. Do NOT commit this file to git!
# ====================================================================
storeFile=$KEYSTORE_NAME
storePassword=$KEYSTORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=$KEYSTORE_PASSWORD
EOF

chmod 600 "$KEY_PROPERTIES_PATH"
echo -e "${GREEN}✓ android/key.properties created successfully!${NC}"

echo ""
echo -e "${YELLOW}➔ Verifying keystore contents...${NC}"
keytool -list -v -keystore "$KEYSTORE_PATH" -storepass "$KEYSTORE_PASSWORD" | grep -E "Alias name|Creation date|Valid from" || true

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✓ RELEASE KEYSTORE & CONFIGURATION READY!        ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Keystore File : ${CYAN}$KEYSTORE_PATH${NC}"
echo -e "Key Alias     : ${CYAN}$KEY_ALIAS${NC}"
echo -e "Config File   : ${CYAN}$KEY_PROPERTIES_PATH${NC}"
echo ""
echo -e "${BOLD}${YELLOW}CRITICAL SECURITY REMINDER:${NC}"
echo -e "1. ${BOLD}BACK UP YOUR KEYSTORE FILE${NC} in a safe location (e.g. Google Drive, 1Password)."
echo -e "   If you lose this key, you will NOT be able to push updates for Embroidex on Google Play!"
echo -e "2. Both ${CYAN}*.keystore${NC} and ${CYAN}key.properties${NC} are git-ignored and will not be pushed to GitHub."
echo ""
echo -e "To compile and automatically sign your App Bundle for Google Play Console:"
echo -e "  ${BOLD}${CYAN}./build_abb.sh${NC}"
echo ""
