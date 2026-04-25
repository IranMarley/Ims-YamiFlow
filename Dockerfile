# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

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
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS runtime
WORKDIR /app

COPY --from=build /app .

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Non-root user — built into .NET 10 base images
USER $APP_UID

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Ims.YamiFlow.API.dll"]
