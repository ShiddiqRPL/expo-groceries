# Use official Node image with npm + npx preinstalled
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files if already created (optional)
# COPY package*.json ./

# Install Expo CLI globally
RUN npm install -g expo-cli

# Default entrypoint
ENTRYPOINT [ "bash" ]
