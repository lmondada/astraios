# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install Hatch
RUN pip install hatch

# Install dependencies
RUN hatch env create

# Run Hatch command (for example, to start a web server)
CMD ["hatch", "run", "serve"]

