# Multi-stage build for Go application with gcloud
FROM golang:1.25.1-alpine AS builder

# Set working directory
WORKDIR /app

# Install git (needed for Go modules)
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary for Linux AMD64 (Cloud Build compatible)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o cbuilder .

# Final stage: use gcloud base image
FROM gcr.io/cloud-builders/gcloud

# Install ca-certificates for HTTPS requests
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder stage
COPY --from=builder /app/cbuilder /usr/local/bin/cbuilder

# Make binary executable
RUN chmod +x /usr/local/bin/cbuilder

# Set the binary as entrypoint (optional - you can also call it manually)
# ENTRYPOINT ["cbuilder"]