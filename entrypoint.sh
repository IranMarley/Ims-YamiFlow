#!/bin/sh
mkdir -p /var/videos
chown -R "$APP_UID" /var/videos
exec gosu "$APP_UID" dotnet Ims.YamiFlow.API.dll
