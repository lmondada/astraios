PROTO_FILES := $(wildcard protos/*.proto protos/tierkreis/*.proto)

.PHONY: all
all: frontend-protos python-protos

.PHONY: python-protos
python-protos: kernels/python/src/astraios_py/protos/astraios/compile \
	kernels/python/src/astraios_py/protos/astraios/worker \
	kernels/python/src/astraios_py/protos/astraios/runtime \
	kernels/python/src/astraios_py/protos/tierkreis/graph \
	kernels/python/src/astraios_py/protos/tierkreis/jobs \
	kernels/python/src/astraios_py/protos/tierkreis/runtime \
	kernels/python/src/astraios_py/protos/tierkreis/signature \
	kernels/python/src/astraios_py/protos/tierkreis/worker


kernels/python/src/astraios_py/protos/astraios/%: protos/%.proto
	mkdir -p kernels/python/src/astraios_py/protos
	cd kernels/python && rye run gen-proto $(notdir $<)

kernels/python/src/astraios_py/protos/tierkreis/%: protos/tierkreis/%.proto
	mkdir -p kernels/python/src/astraios_py/protos
	cd kernels/python && rye run gen-proto tierkreis/$(notdir $<)


.PHONY: frontend-protos
frontend-protos: frontend/src/protos

frontend/src/protos: $(PROTO_FILES)
	mkdir -p frontend/src/protos/tierkreis
	cd frontend && pnpm gen-proto

.PHONY: clean
clean:
	rm -rf kernels/python/src/astraios_py/protos
	rm -rf frontend/src/protos

