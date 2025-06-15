# Use a minimal base image
FROM node:16-slim

# Install Docker CLI and other compilers
USER root
RUN apt-get update && apt-get install -y \
    g++ \
    openjdk-11-jdk \
    python3 \
    python3-pip \
    docker.io \
    curl && \
    apt-get clean

# Create a non-root user (optional but cleaner)
RUN useradd --create-home --shell /bin/bash appuser

# Set working directory
WORKDIR /usr/src/app
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy all source code
COPY . .

# Set permissions for tmp folder
RUN mkdir -p /usr/src/app/tmp && chown -R appuser:appuser /usr/src/app

# Switch to non-root
USER appuser

# Expose app port
EXPOSE 5000

# Start the app
CMD ["node", "index.js"]
