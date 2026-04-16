#!/usr/bin/env bash
set -euo pipefail

PROTO_DIR="./proto"
GEN_DIR="./generated"

rm -rf "$PROTO_DIR" "$GEN_DIR"
mkdir -p "$PROTO_DIR" "$GEN_DIR"

TMP_DIR=$(mktemp -d)
git clone https://github.com/ubuntu/app-center-ratings.git "$TMP_DIR/app-center-ratings"

cp "$TMP_DIR/app-center-ratings/proto/"*.proto "$PROTO_DIR/"

python -m grpc_tools.protoc \
  --proto_path="$PROTO_DIR" \
  --python_out="$GEN_DIR" \
  --grpc_python_out="$GEN_DIR" \
  "$PROTO_DIR"/*.proto


# modify imports starting with ratings_ to be relative imports
find "$GEN_DIR" -name "*.py" | while read -r file; do
  sed -i 's/^import ratings_/from . import ratings_/' "$file"
  sed -i 's/^from ratings_\(.*\) import /from .ratings_\1 import /' "$file"
done
# Create __init__.py for the generated package
echo "# Generated protobuf and gRPC files" > "$GEN_DIR/__init__.py"

rm -rf "$TMP_DIR"

echo "Proto files are in $PROTO_DIR"
echo "Python + gRPC bindings are in $GEN_DIR"
