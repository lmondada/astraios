FROM envoyproxy/envoy:v1.29-latest

# Copy the built frontend to the static directory
COPY /frontend/dist/ /static/

# Copy the envoy config to the envoy directory
COPY ./envoy/envoy.yaml /etc/envoy/envoy.yaml

ENTRYPOINT [ "/usr/local/bin/envoy" ]
CMD [ "-c /etc/envoy/envoy.yaml", "-l trace", "--log-path /tmp/envoy_info.log" ]