# Base environment setup
FROM node:18-alpine

# Set execution directory
WORKDIR /usr/src/app

# Package dependency layer compilation
COPY package*.json ./
RUN npm ci --only=production

# Copy source scripts
COPY . .

# Expose server port
EXPOSE 5000

# Execute server process
CMD ["node", "server.js"]
