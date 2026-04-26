#!/bin/sh
mkdir -p /var/videos
chown -R "$APP_UID" /var/videos
exec su-exec "$APP_UID" dotnet Ims.YamiFlow.API.dll
