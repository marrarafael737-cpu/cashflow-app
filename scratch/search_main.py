with open("main.js", "r", encoding="utf-8") as f:
    lines = f.readlines()
    for idx, line in enumerate(lines):
        if "bottom-nav-hidden" in line or "bottom-nav" in line or "openSidebar" in line:
            print(f"Line {idx+1}: {line.strip()}")
