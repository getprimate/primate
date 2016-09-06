#!/bin/bash
[ "$UID" -eq 0 ] || exec sudo bash "$0" "$@"
echo "Installing into /opt/kongdash-x64"
cp -r kongdash-x64 /opt/kongdash-x64

echo "Creating desktop shortcuts"
mv /opt/kongdash-x64/resources/kongdash.desktop /usr/local/share/applications/

echo "Done."

exit

