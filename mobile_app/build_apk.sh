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
echo -e "${BLUE}          Embroidex - Release APK Builder           ${NC}"
echo -e "${BLUE}====================================================${NC}"

# Navigate to mobile_app root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_NAME="Embroidex"
OUTPUT_APK="$SCRIPT_DIR/${APP_NAME}.apk"

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
echo -e "${CYAN}Output Location  : ${OUTPUT_APK}${NC}"
echo ""

# Remove previous output if exists
rm -f "$OUTPUT_APK"

echo -e "${YELLOW}➔ Step 1/3: Preparing Gradle...${NC}"
cd android
chmod +x ./gradlew

echo -e "${YELLOW}➔ Step 2/3: Compiling Release APK (assembleRelease)...${NC}"
./gradlew assembleRelease --no-daemon

RELEASE_APK_PATH="app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$RELEASE_APK_PATH" ]; then
    # Fallback search if standard path differs
    FOUND_APK=$(find app/build/outputs/apk -name "*.apk" -not -name "*androidTest*" | head -n 1)
    if [ -n "$FOUND_APK" ] && [ -f "$FOUND_APK" ]; then
        RELEASE_APK_PATH="$FOUND_APK"
    else
        echo -e "${RED}Error: Release APK was not generated at $RELEASE_APK_PATH!${NC}"
        exit 1
    fi
fi

cd "$SCRIPT_DIR"
cp "android/$RELEASE_APK_PATH" "$OUTPUT_APK"

echo -e "${YELLOW}➔ Step 3/3: Verifying generated APK...${NC}"
FILE_SIZE=$(du -h "$OUTPUT_APK" | cut -f1)

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✓ BUILD SUCCESSFUL!                               ${NC}"
echo -e "${GREEN}  File Name : $(basename "$OUTPUT_APK")             ${NC}"
echo -e "${GREEN}  Location  : $OUTPUT_APK                           ${NC}"
echo -e "${GREEN}  File Size : $FILE_SIZE                            ${NC}"
echo -e "${GREEN}  Version   : v${VERSION_NAME} (versionCode: ${VERSION_CODE}) ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""
echo -e "To install on a connected Android phone or emulator, run:"
echo -e "  ${CYAN}adb install -r \"$OUTPUT_APK\"${NC}"
echo ""
