#!/usr/bin/env python3
"""
Replace all em-dashes and en-dashes with regular hyphens in src/ files.
- Em-dash  U+2014  —  ->  -
- En-dash  U+2013  –  ->  -
- Figure dash U+2012  ‒  ->  -
- Horizontal bar U+2015  ―  ->  -

Does NOT touch download/ docs (those are intentional typography).
Only touches src/ (application code + UI text).
"""
import os
import sys

REPLACEMENTS = {
    "\u2014": "-",  # em-dash
    "\u2013": "-",  # en-dash
    "\u2012": "-",  # figure dash
    "\u2015": "-",  # horizontal bar
    "\u2212": "-",  # minus sign (sometimes used as dash)
}

SRC_DIR = "/home/z/my-project/src"
changed_files = 0
total_replacements = 0

for root, dirs, files in os.walk(SRC_DIR):
    for fname in files:
        if not fname.endswith((".ts", ".tsx", ".js", ".jsx")):
            continue
        fpath = os.path.join(root, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            print(f"SKIP {fpath}: {e}")
            continue

        original = content
        file_count = 0
        for old_char, new_char in REPLACEMENTS.items():
            count = content.count(old_char)
            if count > 0:
                content = content.replace(old_char, new_char)
                file_count += count

        if content != original:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            changed_files += 1
            total_replacements += file_count
            print(f"  {fpath}: {file_count} replacements")

print(f"\nDone. {changed_files} files changed, {total_replacements} total replacements.")
