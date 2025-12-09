
import json

filename = "data/db.json"
with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '"propertyManagement"' in line:
        print(f"propertyManagement: {i+1}")
    if '"towers"' in line:
        print(f"towers: {i+1}")
