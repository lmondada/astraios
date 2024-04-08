all: kernels/python/protos-gen/protos/compile_pb2.py \
     kernels/python/protos-gen/protos/worker_pb2.py \
     kernels/python/protos-gen/protos/tierkreis/graph_pb2.py \
	 frontend/src/protos

.PHONY: all

kernels/python/protos-gen:
	mkdir -p kernels/python/protos-gen/protos/tierkreis

kernels/python/protos-gen/protos/compile_pb2.py: protos/compile.proto kernels/python/protos-gen
	python -m grpc_tools.protoc \
	       -I. \
	       --python_out=kernels/python/protos-gen \
	       --pyi_out=kernels/python/protos-gen \
	       --grpc_python_out=kernels/python/protos-gen \
	       protos/compile.proto

kernels/python/protos-gen/protos/worker_pb2.py: protos/worker.proto kernels/python/protos-gen
	python -m grpc_tools.protoc \
	       -I. \
	       --python_out=kernels/python/protos-gen \
	       --pyi_out=kernels/python/protos-gen \
	       --grpc_python_out=kernels/python/protos-gen \
	       protos/worker.proto

kernels/python/protos-gen/protos/tierkreis/graph_pb2.py: protos/tierkreis/graph.proto kernels/python/protos-gen
	python -m grpc_tools.protoc \
	       -I. \
	       --python_out=kernels/python/protos-gen \
	       --pyi_out=kernels/python/protos-gen \
	       --grpc_python_out=kernels/python/protos-gen \
	       protos/tierkreis/graph.proto

frontend/src/protos:
	mkdir -p frontend/src/protos/tierkreis
	cd frontend && pnpm gen-proto

.PHONY: clean
clean:
	rm -f kernels/python/protos-gen/protos/*pb2*.py*
	rm -f kernels/python/protos-gen/protos/tierkreis/*pb2*.py*
	rm -rf kernels/python/protos-gen/*.egg-info
	rm -rf kernels/python/protos-gen/build
	rm -rf frontend/src/protos

