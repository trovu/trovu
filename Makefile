IMAGE_NAME=trovu-monorepo
CONTAINER_NAME=trovu-server

build:
	docker build -t $(IMAGE_NAME) .

run:
	docker run -d --name $(CONTAINER_NAME) -p 8081:8081 --rm $(IMAGE_NAME)

stop:
	docker stop $(CONTAINER_NAME)

clean:
	docker rm $(CONTAINER_NAME)
	docker rmi $(IMAGE_NAME)

rebuild: clean build run

.PHONY: build run stop clean rebuild
