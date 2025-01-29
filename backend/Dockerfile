# Use a minimal base image
FROM node:16-slim

# Install required compilers
RUN apt-get update && apt-get install -y \
    g++ \
    openjdk-11-jdk \
    python3 \
    python3-pip && \
    apt-get clean

# Create a non-root user
RUN useradd --create-home --shell /bin/bash appuser

# Set working directory and adjust permissions
WORKDIR /usr/src/app
COPY package*.json ./

# Ensure appuser owns the working directory
RUN chown -R appuser:appuser /usr/src/app

# Switch to the non-root user
USER appuser

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY --chown=appuser:appuser . .

# Expose application port
EXPOSE 4000

# Run the application
CMD ["node", "index.js"]
