from main import app
import json

print("\n--- REGISTERED ROUTES ---")
for route in app.routes:
    methods = ", ".join(route.methods) if hasattr(route, "methods") else "None"
    print(f"{methods} : {route.path}")
print("-------------------------\n")
