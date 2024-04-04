FROM envoyproxy/envoy:v1.29-latest

# Copy the envoy config to the envoy directory
COPY ./envoy.yaml /etc/envoy/envoy.yaml

ENTRYPOINT [ "/usr/local/bin/envoy" ]
CMD [ "-c /etc/envoy/envoy.yaml", "-l trace", "--log-path /tmp/envoy_info.log" ]