FROM node:24.4.1-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libcurl4 \
  libdrm-dev \
  libgbm-dev \
  libgconf-2-4 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libxrender1 \
  libxtst6 \
  xdg-utils \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

RUN npm install -g bun
WORKDIR /usr/src/app

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
COPY . .
RUN bun install --frozen-lockfile
ARG VITE_APP_URL
ARG VITE_SERVER_URL
ENV NODE_ENV=production
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release

# Create database directory and set proper permissions
RUN mkdir -p /app/data && \
  groupadd -r appgroup && \
  useradd -r -g appgroup appuser && \
  chown -R appuser:appgroup /app

# Set database path to the data directory
ENV DB_FILE_NAME="/app/data/db.sqlite"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Copy files with proper ownership
COPY --chown=appuser:appgroup entrypoint.sh .
COPY --from=prerelease --chown=appuser:appgroup /usr/src/app/server ./server
COPY --from=prerelease --chown=appuser:appgroup /usr/src/app/node_modules ./node_modules
COPY --from=prerelease --chown=appuser:appgroup /usr/src/app/package.json .
COPY --from=prerelease --chown=appuser:appgroup /usr/src/app/app/dist ./server/src/dist

# Switch to non-root user AFTER setting up directories
USER appuser

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# run the app
EXPOSE 3001/tcp
ENTRYPOINT [ "./entrypoint.sh" ]
