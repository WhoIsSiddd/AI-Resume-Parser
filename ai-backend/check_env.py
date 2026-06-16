import sys
import os
import importlib

packages = ["fastapi", "uvicorn", "pydantic", "spacy", "sentence_transformers", "numpy", "torch", "fitz", "docx"]

print(f"Python version: {sys.version}")
print(f"Executable: {sys.executable}")
print("-" * 20)

for pkg in packages:
    try:
        importlib.import_module(pkg)
        print(f"LOADED: {pkg}")
    except ImportError as e:
        print(f"FAILED: {pkg} ({e})")
    except Exception as e:
        print(f"ERROR: {pkg} ({e})")
