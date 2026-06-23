#!/usr/bin/env python3
"""Copy Nuwa example skills without changing any source byte."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tree_manifest(source: Path) -> str:
    lines = []
    for path in sorted(item for item in source.rglob("*") if item.is_file()):
        lines.append(f"{file_hash(path)}  {path.relative_to(source).as_posix()}")
    return "\n".join(lines) + "\n"


def import_skill(source_root: Path, destination_root: Path, item: dict) -> None:
    slug = item["slug"]
    source = source_root / slug
    destination = destination_root / slug
    if not (source / "SKILL.md").is_file():
        raise FileNotFoundError(f"missing source Skill: {source}")
    if destination.exists():
        raise FileExistsError(f"destination already exists: {destination}")

    expected_manifest = tree_manifest(source)
    shutil.copytree(source, destination, copy_function=shutil.copy2)
    actual_manifest = tree_manifest(destination)
    if actual_manifest != expected_manifest:
        shutil.rmtree(destination)
        raise RuntimeError(f"byte preservation check failed: {slug}")

    legacy_dir = destination / "references" / "legacy"
    legacy_dir.mkdir(parents=True, exist_ok=True)
    original = legacy_dir / "SKILL.original.md"
    shutil.copy2(source / "SKILL.md", original)
    (legacy_dir / "source-tree.sha256").write_text(expected_manifest, encoding="utf-8")

    manifest = {
        "schema_version": 1,
        "slug": slug,
        "display_name": item["display_name"],
        "aliases": [],
        "status": "draft",
        "privacy": "public",
        "living_person": item["living_person"],
        "research_cutoff": item["research_cutoff"],
        "legacy_sha256": file_hash(original),
        "council_domains": item["council_domains"],
    }
    (destination / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"IMPORTED {slug}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("--destination", type=Path, default=ROOT / "skills" / "public")
    parser.add_argument("--map", type=Path, default=ROOT / "skills" / "import-map.json")
    args = parser.parse_args()

    config = json.loads(args.map.read_text(encoding="utf-8"))
    args.destination.mkdir(parents=True, exist_ok=True)
    for item in config["skills"]:
        import_skill(args.source_root, args.destination, item)
    return 0


if __name__ == "__main__":
    sys.exit(main())
