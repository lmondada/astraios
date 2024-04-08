all: kernels/python/protos-gen/protos/compile_pb2.py \
     kernels/python/protos-gen/protos/worker_pb2.py \
     kernels/python/protos-gen/protos/tierkreis/graph_pb2.py \
	 frontend/src/protos/compile.ts \
	 frontend/src/protos/worker.ts \
	 frontend/src/protos/tierkreis/graph.ts \
	 frontend/src/protos/tierkreis/runtime.ts \
	 frontend/src/protos/tierkreis/signature.ts \

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


frontend/src/protos/compile.ts: protos/compile.proto frontend/src/protos
	cd frontend && pnpm gen-proto protos/compile.proto

frontend/src/protos/worker.ts: protos/worker.proto frontend/src/protos
	cd frontend && pnpm gen-proto protos/worker.proto

frontend/src/protos/tierkreis/graph.ts: protos/tierkreis/graph.proto frontend/src/protos
	cd frontend && pnpm gen-proto protos/tierkreis/graph.proto

frontend/src/protos/tierkreis/runtime.ts: protos/tierkreis/runtime.proto frontend/src/protos
	cd frontend && pnpm gen-proto protos/tierkreis/runtime.proto

frontend/src/protos/tierkreis/signature.ts: protos/tierkreis/signature.proto frontend/src/protos
	cd frontend && pnpm gen-proto protos/tierkreis/signature.proto

.PHONY: clean
clean:
	rm -f kernels/python/protos-gen/protos/*pb2*.py*
	rm -f kernels/python/protos-gen/protos/tierkreis/*pb2*.py*
	rm -rf kernels/python/protos-gen/*.egg-info
	rm -rf kernels/python/protos-gen/build