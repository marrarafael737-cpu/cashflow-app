import subprocess

result = subprocess.run(["git", "show", "9e025c4^:dashboard.html"], capture_output=True, text=True, encoding="utf-8")
if result.returncode == 0:
    lines = result.stdout.splitlines()
    for idx in range(min(75, len(lines))):
        print(f"{idx+1}: {lines[idx]}")
else:
    print("Error:", result.stderr)
