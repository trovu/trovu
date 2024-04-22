# Define the name of the Docker image
IMAGE_NAME=trovu-website

# Define the container name
CONTAINER_NAME=trovu-server

# Build the Docker image
build:
	docker build -t $(IMAGE_NAME) .

# Run the Docker container
run:
	docker run -d --name $(CONTAINER_NAME) -p 8081:8081 $(IMAGE_NAME)

# Stop the Docker container
stop:
	docker stop $(CONTAINER_NAME)

# Remove the Docker container
clean:
	docker rm $(CONTAINER_NAME)
	docker rmi $(IMAGE_NAME)

# Rebuild the Docker image and container
rebuild: clean build run

.PHONY: build run stop clean rebuild
