# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install Hatch
RUN pip install hatch

RUN apt-get update && \
    apt-get install -y git protobuf-compiler && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN hatch env create

# Run Hatch command (for example, to start a web server)
CMD ["hatch", "run", "serve"]

