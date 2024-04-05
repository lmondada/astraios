all: kernels/python/astraios_py/protos/compile_pb2.py \
     kernels/python/astraios_py/protos/worker_pb2.py \
	 frontend/src/protos/compile.ts \
	 frontend/src/protos/worker.ts \

.PHONY: all

kernels/python/astraios_py/protos:
	mkdir -p kernels/python/astraios_py/protos

kernels/python/astraios_py/protos/compile_pb2.py: protos/compile.proto kernels/python/astraios_py/protos
	python -m grpc_tools.protoc \
	       -Iastraios_py/protos=protos \
	       --python_out=kernels/python \
	       --pyi_out=kernels/python \
	       --grpc_python_out=kernels/python \
	       protos/compile.proto

kernels/python/astraios_py/protos/worker_pb2.py: protos/worker.proto kernels/python/astraios_py/protos
	python -m grpc_tools.protoc \
	       -Iastraios_py/protos=protos \
	       --python_out=kernels/python \
	       --pyi_out=kernels/python \
	       --grpc_python_out=kernels/python \
	       protos/worker.proto

frontend/src/protos:
	mkdir -p frontend/src/protos


frontend/src/protos/compile.ts: protos/compile.proto frontend/src/protos
	cd frontend && pnpm gen-proto compile.proto

frontend/src/protos/worker.ts: protos/worker.proto frontend/src/protos
	cd frontend && pnpm gen-proto worker.proto
