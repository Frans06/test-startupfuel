FROM node:24.4.1-slim AS base


RUN apt-get update && apt-get install -y \
  wget \
  gnupg \
  ca-certificates \
  procps \
  libxss1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libgtk-3-0 \
  libxkbcommon0 \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g bun
WORKDIR /usr/src/app

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV CHROME_DEVEL_SANDBOX=/usr/lib/chromium-browser/chrome-sandbox
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
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV CHROME_DEVEL_SANDBOX=/usr/lib/chromium-browser/chrome-sandbox

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
