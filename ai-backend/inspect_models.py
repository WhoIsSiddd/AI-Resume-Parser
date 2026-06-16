import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

import pydantic
from pydantic import BaseModel

print(f"Pydantic version: {pydantic.VERSION}")

def inspect_models():
    import api.schemas as schemas
    for name in dir(schemas):
        attr = getattr(schemas, name)
        if isinstance(attr, type) and issubclass(attr, BaseModel) and attr is not BaseModel:
            print(f"Inspecting model: {name}")
            for field_name in dir(attr):
                if field_name == "REGEX":
                    print(f"  FOUND REGEX in {name}!")

inspect_models()

print("Inspection complete.")
