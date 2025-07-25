FROM node:22.4-slim AS base
RUN npm install -g bun
WORKDIR /usr/src/app

FROM base AS prerelease
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
COPY . .
RUN bun install --frozen-lockfile
ARG VITE_APP_URL
ARG VITE_SERVER_URL
ENV NODE_ENV=production
RUN bun run build

FROM base AS release
# Create database directory and set proper permissions
RUN mkdir -p /app/data && \
  groupadd -r appgroup && \
  useradd -r -g appgroup appuser

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libgtk-3-0 \
  libgtk-4-1 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Set proper ownership after creating directories
RUN chown -R appuser:appgroup /app

# Set environment variables
ENV DB_FILE_NAME="/app/data/db.sqlite"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

# Copy files with proper ownership
COPY --chown=appuser:appgroup entrypoint.sh .
COPY --from=prerelease --chown=appuser:appgroup /usr/src/app/server ./server
COPY --from=prerelease --chown=appuser:appgroup /usr/src/app/node_modules ./node_modules
COPY --from=prerelease --chown=appuser:appgroup /usr/src/app/package.json .
COPY --from=prerelease --chown=appuser:appgroup /usr/src/app/app/dist ./server/src/dist

# Switch to non-root user
USER appuser

# Make entrypoint executable
RUN chmod +x entrypoint.sh

EXPOSE 3001/tcp
ENTRYPOINT [ "./entrypoint.sh" ]
