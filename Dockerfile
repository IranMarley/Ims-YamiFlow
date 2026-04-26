# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Restore — copy only project files first to leverage layer caching
COPY Ims.YamiFlow.sln .
COPY src/Ims.YamiFlow.API/Ims.YamiFlow.API.csproj                         src/Ims.YamiFlow.API/
COPY src/Ims.YamiFlow.Application/Ims.YamiFlow.Application.csproj         src/Ims.YamiFlow.Application/
COPY src/Ims.YamiFlow.Domain/Ims.YamiFlow.Domain.csproj                   src/Ims.YamiFlow.Domain/
COPY src/Ims.YamiFlow.Infrastructure/Ims.YamiFlow.Infrastructure.csproj   src/Ims.YamiFlow.Infrastructure/

RUN dotnet restore

# Build & publish
COPY . .
RUN dotnet publish src/Ims.YamiFlow.API/Ims.YamiFlow.API.csproj \
    -c Release -o /app

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM mwader/static-ffmpeg:8.1 AS ffmpeg-static

FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS runtime
WORKDIR /app

COPY --from=build /app .
COPY --from=ffmpeg-static /ffmpeg  /usr/bin/ffmpeg
COPY --from=ffmpeg-static /ffprobe /usr/bin/ffprobe

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 musl gosu \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/videos

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
