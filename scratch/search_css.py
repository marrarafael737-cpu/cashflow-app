import os
import re

css_dir = "css"
pattern = re.compile(r"(\.fa|i\b|bottom-nav|magic-input|btn-ghost-icon|btn-scan|btn-voice|font-family)", re.IGNORECASE)

for root, dirs, files in os.walk(css_dir):
    for file in files:
        if file.endswith(".css"):
            filepath = os.path.join(root, file)
            print(f"\n--- Searching {filepath} ---")
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()
                for idx, line in enumerate(lines):
                    if pattern.search(line):
                        print(f"Line {idx+1}: {line.strip()}")
