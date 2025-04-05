# Docker image names and tags
IMAGE_NAME = sirenefr
IMAGE_TAG = latest
DEV_IMAGE_NAME = sirenefr-dev
DEV_IMAGE_TAG = latest

# Full image references
IMAGE = $(IMAGE_NAME):$(IMAGE_TAG)
DEV_IMAGE = $(DEV_IMAGE_NAME):$(DEV_IMAGE_TAG)

# Container name
CONTAINER_NAME = nextjs-container

# Host port to map to container port 3000
HOST_PORT = 3000

.PHONY: build run stop clean shell logs help build-dev dev build-verify

# Build the Docker image
build:
	docker build -t $(IMAGE) -f Dockerfile .

# Build and verify the production build works
build-verify:
	docker build -t $(IMAGE) -f Dockerfile . && \
	echo "Build successful. Starting container to verify it works..." && \
	docker run -it --rm -p $(HOST_PORT):3000 $(IMAGE)

# Run the container in detached mode
run:
	docker run -d --name $(CONTAINER_NAME) -p $(HOST_PORT):3000 $(IMAGE)

# Run the container in interactive mode
run-interactive:
	docker run -it --name $(CONTAINER_NAME) -p $(HOST_PORT):3000 $(IMAGE)

# Stop and remove the container
stop:
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

# Stop, remove container, and remove image
clean: stop
	docker rmi $(IMAGE) || true

# Restart the container (stop if running, then start)
restart: stop run

# Open a shell in the running container
shell:
	docker exec -it $(CONTAINER_NAME) /bin/sh

# View container logs
logs:
	docker logs -f $(CONTAINER_NAME)

# Display help information
help:
	@echo "Available commands:"
	@echo "  make build            - Build the Docker image"
	@echo "  make run              - Run the container in detached mode"
	@echo "  make run-interactive  - Run the container in interactive mode"
	@echo "  make stop             - Stop and remove the container"
	@echo "  make restart          - Restart the container"
	@echo "  make clean            - Stop container and remove image"
	@echo "  make shell            - Open a shell in the running container"
	@echo "  make logs             - View container logs"
	@echo "  make build-dev        - Build the Docker image for development"
	@echo "  make build-verify     - Build and verify the production Docker image works"
	@echo "  make dev              - Build and run in development mode with hot reloading"
	@echo "  make help             - Display this help information"

# Build development image
build-dev:
	docker build -t $(DEV_IMAGE) -f Dockerfile.dev .

# Development environment setup
dev: build-dev
	docker run -it --rm -v $(PWD):/app -p $(HOST_PORT):3000 $(DEV_IMAGE)

# Default target
all: build run
