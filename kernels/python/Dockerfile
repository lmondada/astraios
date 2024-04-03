# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install Hatch
RUN pip install hatch

# HACK: use a patched version of tierkreis
RUN apt-get update && \
    apt-get install -y git protobuf-compiler && \
    rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/CQCL/tierkreis.git /app/tierkreis
COPY relax_protobuf.patch /app
RUN patch /app/tierkreis/pyproject.toml < relax_protobuf.patch
# RUN hatch run pip install /tierkreis
RUN hatch run pip install /app

# Run Hatch command (for example, to start a web server)
CMD ["hatch", "run", "serve"]

