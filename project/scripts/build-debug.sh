#!/bin/bash -e
source ../emsdk/emsdk_env.sh
export EMSCRIPTEN=${EMSDK}/upstream/emscripten
mkdir -p ../build

echo

export EMSCRIPTEN_CUSTOM_CXX_FLAGS="-O0 -g -s ASSERTIONS=1 -fno-lto --ignore-dynamic-linking"
cmake \
  -S./ \
  -H./ \
  -B../build \
  -DCMAKE_TOOLCHAIN_FILE="$EMSCRIPTEN/cmake/Modules/Platform/Emscripten.cmake" \
  -DCMAKE_CXX_FLAGS_RELEASE="-O0 -g" \
  -DCMAKE_BUILD_TYPE=Release \
  -G "Ninja"

cmake --build ../build --parallel 8

ls -lh ./packages/spglsl/wasm || true
