# Use the official Node.js 18 image.
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy the existing app directory contents into the container at /app
COPY . /app

# Install dependencies
RUN npm clean-install

# Build the website
RUN npm run build

# Open port for the service
EXPOSE 8081

# Command to serve the app
CMD ["npm", "run", "serve"]
