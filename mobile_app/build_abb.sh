#!/usr/bin/env bash
set -e

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   Embroidex - Android App Bundle (AAB/ABB) Builder ${NC}"
echo -e "${BLUE}====================================================${NC}"

# Navigate to mobile_app root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_NAME="Embroidex"
OUTPUT_AAB="$SCRIPT_DIR/${APP_NAME}.aab"
OUTPUT_ABB="$SCRIPT_DIR/${APP_NAME}.abb"

# Check android directory
if [ ! -d "android" ]; then
    echo -e "${RED}Error: 'android' directory not found!${NC}"
    echo -e "Please execute this script from the 'mobile_app' folder."
    exit 1
fi

# Detect version info from build.gradle
VERSION_CODE=$(grep -E 'versionCode\s+[0-9]+' android/app/build.gradle | head -n 1 | awk '{print $2}' || echo "1")
VERSION_NAME=$(grep -E 'versionName\s+"[^"]+"' android/app/build.gradle | head -n 1 | awk -F'"' '{print $2}' || echo "1.0")

echo -e "${CYAN}Target App Name  : ${APP_NAME}${NC}"
echo -e "${CYAN}App Version      : v${VERSION_NAME} (code: ${VERSION_CODE})${NC}"
echo -e "${CYAN}Outputs Target   : ${APP_NAME}.aab & ${APP_NAME}.abb${NC}"
echo ""

# Remove previous outputs if exist
rm -f "$OUTPUT_AAB" "$OUTPUT_ABB"

echo -e "${YELLOW}➔ Step 1/3: Preparing Gradle...${NC}"
cd android
chmod +x ./gradlew

echo -e "${YELLOW}➔ Step 2/3: Compiling Release Bundle (bundleRelease)...${NC}"
./gradlew bundleRelease --no-daemon

RELEASE_AAB_PATH="app/build/outputs/bundle/release/app-release.aab"

if [ ! -f "$RELEASE_AAB_PATH" ]; then
    # Fallback search if standard path differs
    FOUND_AAB=$(find app/build/outputs/bundle -name "*.aab" | head -n 1)
    if [ -n "$FOUND_AAB" ] && [ -f "$FOUND_AAB" ]; then
        RELEASE_AAB_PATH="$FOUND_AAB"
    else
        echo -e "${RED}Error: Release App Bundle was not generated at $RELEASE_AAB_PATH!${NC}"
        exit 1
    fi
fi

cd "$SCRIPT_DIR"
# Copy bundle to both .aab (standard Play Store format) and .abb (convenience format)
cp "android/$RELEASE_AAB_PATH" "$OUTPUT_AAB"
cp "android/$RELEASE_AAB_PATH" "$OUTPUT_ABB"

echo -e "${YELLOW}➔ Step 3/3: Verifying generated App Bundle...${NC}"
FILE_SIZE=$(du -h "$OUTPUT_AAB" | cut -f1)

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✓ BUILD SUCCESSFUL!                               ${NC}"
echo -e "${GREEN}  Primary AAB (Play Store) : $OUTPUT_AAB            ${NC}"
echo -e "${GREEN}  Copy ABB                 : $OUTPUT_ABB            ${NC}"
echo -e "${GREEN}  File Size                : $FILE_SIZE             ${NC}"
echo -e "${GREEN}  Version                  : v${VERSION_NAME} (code: ${VERSION_CODE}) ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""
echo -e "You can upload ${CYAN}${APP_NAME}.aab${NC} to Google Play Console."
echo -e "For release versioning rules & instructions, refer to:"
echo -e "  ${CYAN}AAB_VERSION_CONTROL.md${NC}"
echo ""
