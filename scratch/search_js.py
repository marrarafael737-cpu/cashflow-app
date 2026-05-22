import os
import re

pattern = re.compile(r"(bottom-nav-hidden|openSidebar|toggle-sidebar|bottom-nav|btn-toggle-sidebar-mobile)", re.IGNORECASE)

for root, dirs, files in os.walk("."):
    # skip .git, .agent, scratch, node_modules
    if any(p in root for p in [".git", ".agent", "scratch", "node_modules"]):
        continue
    for file in files:
        if file.endswith(".js") or file.endswith(".html"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                try:
                    lines = f.readlines()
                    for idx, line in enumerate(lines):
                        if pattern.search(line):
                            print(f"{filepath} Line {idx+1}: {line.strip()}")
                except Exception as e:
                    pass
