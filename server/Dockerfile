FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm ci

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

# Run the server
CMD ["npm", "start"]
