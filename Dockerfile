# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY server.js .
COPY questions.json .
COPY public/ ./public/

# Expose port
EXPOSE 8555

# Start the application
CMD ["npm", "start"]
