all: kernels/python/src/astraios_py/protos/compile_pb2.py kernels/python/src/astraios_py/protos/worker_pb2.py

.PHONY: all

kernels/python/src/astraios_py/protos/compile_pb2.py: protos/compile.proto
	mkdir -p kernels/python/src/astraios_py/protos
	python -m grpc_tools.protoc \
	       -Iastraios_py/protos=protos \
	       --python_out=kernels/python/src \
	       --pyi_out=kernels/python/src \
	       --grpc_python_out=kernels/python/src \
	       protos/compile.proto

kernels/python/src/astraios_py/protos/worker_pb2.py: protos/worker.proto
	mkdir -p kernels/python/src/astraios_py/protos
	python -m grpc_tools.protoc \
	       -Iastraios_py/protos=protos \
	       --python_out=kernels/python/src \
	       --pyi_out=kernels/python/src \
	       --grpc_python_out=kernels/python/src \
	       protos/worker.proto
