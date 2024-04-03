all: kernels/python/astraios_py/protos/compile_pb2.py \
     kernels/python/astraios_py/protos/worker_pb2.py \
	 frontend/src/protos/compile_pb.js \
	 frontend/src/protos/worker_pb.js \

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


frontend/src/protos/compile_pb.js: protos/compile.proto frontend/src/protos
	protoc -I=protos/ compile.proto \
			--js_out=import_style=commonjs,binary:frontend/src/protos/ \
			--grpc-web_out=import_style=typescript,mode=grpcweb:frontend/src/protos/

frontend/src/protos/worker_pb.js: protos/worker.proto frontend/src/protos
	protoc -I=protos/ worker.proto \
			--js_out=import_style=commonjs,binary:frontend/src/protos/ \
			--grpc-web_out=import_style=typescript,mode=grpcweb:frontend/src/protos/
