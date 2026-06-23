#!/usr/bin/env python3
"""Validate Perspective Council person skills against the Nuwa admission gate."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT / "skills" / "quality-policy.json"


@dataclass(frozen=True)
class Finding:
    code: str
    message: str


def load_json(path: Path) -> object:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def section(markdown: str, title_pattern: str) -> str | None:
    match = re.search(
        rf"^##\s+[^\n]*(?:{title_pattern})[^\n]*\n(.*?)(?=^##\s+|\Z)",
        markdown,
        re.MULTILINE | re.DOTALL | re.IGNORECASE,
    )
    return match.group(1) if match else None


def h3_blocks(value: str) -> list[tuple[str, str]]:
    matches = list(re.finditer(r"^###\s+(.+)$", value, re.MULTILINE))
    blocks: list[tuple[str, str]] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(value)
        blocks.append((match.group(1).strip(), value[match.end():end]))
    return blocks


def list_item_count(value: str) -> int:
    return len(re.findall(r"^(?:[-*]\s+|\d+[.)]\s+)", value, re.MULTILINE))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_manifest(skill_dir: Path, findings: list[Finding]) -> dict:
    path = skill_dir / "manifest.json"
    if not path.is_file():
        findings.append(Finding("manifest.missing", "manifest.json is required"))
        return {}
    try:
        manifest = load_json(path)
    except (OSError, json.JSONDecodeError) as error:
        findings.append(Finding("manifest.invalid", str(error)))
        return {}
    required = {
        "schema_version", "slug", "display_name", "status", "privacy",
        "living_person", "research_cutoff", "legacy_sha256",
    }
    missing = sorted(required - set(manifest))
    if missing:
        findings.append(Finding("manifest.fields", f"missing fields: {', '.join(missing)}"))
    if manifest.get("slug") != skill_dir.name:
        findings.append(Finding("manifest.slug", "slug must match directory name"))
    if manifest.get("privacy") not in {"public", "private"}:
        findings.append(Finding("manifest.privacy", "privacy must be public or private"))
    cutoff = manifest.get("research_cutoff", "")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", cutoff):
        findings.append(Finding("manifest.cutoff", "research_cutoff must be YYYY-MM-DD"))
    legacy_hash = manifest.get("legacy_sha256")
    legacy_path = skill_dir / "references" / "legacy" / "SKILL.original.md"
    if legacy_hash:
        if not legacy_path.is_file():
            findings.append(Finding("legacy.missing", "legacy hash exists but original file is missing"))
        elif sha256(legacy_path) != legacy_hash:
            findings.append(Finding("legacy.hash", "legacy original does not match recorded SHA-256"))
    return manifest


def validate_research(skill_dir: Path, policy: dict, findings: list[Finding]) -> None:
    research_dir = skill_dir / "references" / "research"
    for filename in policy["required_research_files"]:
        path = research_dir / filename
        if not path.is_file() or not path.read_text(encoding="utf-8").strip():
            findings.append(Finding("research.missing", filename))
            continue
        content = path.read_text(encoding="utf-8")
        if "generated-research-view" not in content:
            continue
        references = re.findall(r"\[完整原始材料\]\((\.\./[^)]+)\)", content)
        if not references:
            findings.append(Finding("research.references", f"{filename} has no source material"))
            continue
        total_chars = 0
        for reference in references:
            source = (research_dir / reference).resolve()
            references_root = (skill_dir / "references").resolve()
            if references_root not in source.parents or not source.is_file():
                findings.append(Finding("research.references", f"{filename} has invalid source: {reference}"))
                continue
            total_chars += len(source.read_text(encoding="utf-8"))
        minimum = policy["minimum_referenced_research_chars"]
        if total_chars < minimum:
            findings.append(Finding("research.depth", f"{filename} references {total_chars} chars; minimum is {minimum}"))


def validate_recent_activity(skill_dir: Path, manifest: dict, findings: list[Finding]) -> None:
    if not manifest.get("living_person"):
        return
    timeline = skill_dir / "references" / "research" / "06-timeline.md"
    if not timeline.is_file():
        return
    content = timeline.read_text(encoding="utf-8")
    if not re.search(r"最近12个月|最新动态|last 12 months|recent activity", content, re.IGNORECASE):
        findings.append(Finding("research.recent_activity", "living people require a recent activity section"))


def validate_sources(skill_dir: Path, policy: dict, findings: list[Finding]) -> None:
    path = skill_dir / "references" / "source-ledger.json"
    if not path.is_file():
        findings.append(Finding("sources.missing", "source-ledger.json is required"))
        return
    try:
        ledger = load_json(path)
    except (OSError, json.JSONDecodeError) as error:
        findings.append(Finding("sources.invalid", str(error)))
        return
    sources = ledger.get("sources", []) if isinstance(ledger, dict) else []
    urls: set[str] = set()
    ids: set[str] = set()
    primary = 0
    for index, source in enumerate(sources):
        if not isinstance(source, dict):
            findings.append(Finding("sources.entry", f"source {index + 1} must be an object"))
            continue
        source_id = source.get("id")
        url = source.get("url", "")
        source_type = source.get("type")
        dimensions = source.get("dimensions", [])
        if not source_id or source_id in ids:
            findings.append(Finding("sources.id", f"invalid or duplicate id at source {index + 1}"))
        ids.add(source_id)
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.netloc or url in urls:
            findings.append(Finding("sources.url", f"invalid or duplicate URL at source {index + 1}"))
        urls.add(url)
        if source_type not in {"primary", "secondary"}:
            findings.append(Finding("sources.type", f"invalid type at source {index + 1}"))
        primary += source_type == "primary"
        if not dimensions:
            findings.append(Finding("sources.dimensions", f"dimensions missing at source {index + 1}"))
    if len(urls) < policy["minimum_unique_sources"]:
        findings.append(Finding("sources.count", f"{len(urls)} unique sources; minimum is {policy['minimum_unique_sources']}"))
    if urls and primary / len(urls) <= policy["minimum_primary_source_ratio_exclusive"]:
        findings.append(Finding("sources.primary_ratio", f"primary ratio is {primary}/{len(urls)}; must be >50%"))


def validate_markdown(skill_dir: Path, policy: dict, findings: list[Finding]) -> None:
    path = skill_dir / "SKILL.md"
    if not path.is_file():
        findings.append(Finding("skill.missing", "SKILL.md is required"))
        return
    text = path.read_text(encoding="utf-8")
    frontmatter = text.split("---", 2)[1] if text.startswith("---\n") and text.count("---") >= 2 else ""
    if not re.search(r"^name:\s*\S+", frontmatter, re.MULTILINE) or not re.search(
        r"^description:\s*(?:\||\S+)", frontmatter, re.MULTILINE
    ):
        findings.append(Finding("skill.frontmatter", "frontmatter name and description are required"))
    if "Agentic Protocol" not in text or not all(f"Step {step}" in text for step in range(1, 4)):
        findings.append(Finding("skill.protocol", "three-step Agentic Protocol is required"))

    models = section(text, r"核心心智模型|Mental Models?")
    model_blocks = h3_blocks(models) if models else []
    bounds = policy["mental_models"]
    if not bounds["minimum"] <= len(model_blocks) <= bounds["maximum"]:
        findings.append(Finding("models.count", f"{len(model_blocks)} models; expected {bounds['minimum']}-{bounds['maximum']}"))
    for title, body in model_blocks:
        for label, pattern in {
            "evidence": r"证据|evidence",
            "application": r"应用|适用|application",
            "limitation": r"局限|失效|盲区|limitation|blind spot",
        }.items():
            if not re.search(pattern, body, re.IGNORECASE):
                findings.append(Finding(f"models.{label}", f"{title} lacks {label}"))

    heuristics = section(text, r"决策启发式|Decision Heuristics?")
    heuristic_blocks = h3_blocks(heuristics) if heuristics else []
    if not heuristic_blocks and heuristics:
        count = list_item_count(heuristics)
    else:
        count = len(heuristic_blocks)
    bounds = policy["decision_heuristics"]
    if not bounds["minimum"] <= count <= bounds["maximum"]:
        findings.append(Finding("heuristics.count", f"{count} heuristics; expected {bounds['minimum']}-{bounds['maximum']}"))

    for code, pattern in {
        "expression": r"表达DNA|Expression DNA",
        "values": r"价值观.*反模式|Values.*Anti-patterns",
        "sources": r"调研来源|Research Sources|Sources",
    }.items():
        if not section(text, pattern):
            findings.append(Finding(f"skill.{code}", f"missing {code} section"))

    tensions = section(text, r"内在张力|Tensions?")
    tension_count = max(
        len(h3_blocks(tensions)),
        list_item_count(tensions),
        len(re.findall(r"\*\*张力[一二三四五六七八九十\d]", tensions or "")),
    ) if tensions else 0
    if tension_count < policy["minimum_tensions"]:
        findings.append(Finding("tensions.count", f"{tension_count} tensions; minimum is {policy['minimum_tensions']}"))

    boundaries = section(text, r"诚实边界|Honest Boundar")
    boundary_count = list_item_count(boundaries) if boundaries else 0
    if boundary_count < policy["minimum_honest_boundaries"]:
        findings.append(Finding("boundaries.count", f"{boundary_count} boundaries; minimum is {policy['minimum_honest_boundaries']}"))


def validate_tests(skill_dir: Path, policy: dict, manifest: dict, findings: list[Finding]) -> None:
    path = skill_dir / "tests" / "cases.json"
    if not path.is_file():
        findings.append(Finding("tests.missing", "tests/cases.json is required"))
        return
    try:
        cases_doc = load_json(path)
    except (OSError, json.JSONDecodeError) as error:
        findings.append(Finding("tests.invalid", str(error)))
        return
    cases = cases_doc.get("cases", []) if isinstance(cases_doc, dict) else []
    for case_type, minimum in policy["required_tests"].items():
        count = sum(case.get("type") == case_type for case in cases if isinstance(case, dict))
        if count < minimum:
            findings.append(Finding("tests.count", f"{case_type}: {count}; minimum is {minimum}"))
    if manifest.get("status") == "ready":
        results_path = skill_dir / "tests" / "results.json"
        if not results_path.is_file():
            findings.append(Finding("tests.results", "ready skills require tests/results.json"))
        else:
            results = load_json(results_path)
            if not results.get("passed"):
                findings.append(Finding("tests.failed", "ready skill results must be passing"))


def validate_skill(skill_dir: Path, policy: dict) -> list[Finding]:
    findings: list[Finding] = []
    manifest = validate_manifest(skill_dir, findings)
    validate_research(skill_dir, policy, findings)
    validate_recent_activity(skill_dir, manifest, findings)
    validate_sources(skill_dir, policy, findings)
    validate_markdown(skill_dir, policy, findings)
    validate_tests(skill_dir, policy, manifest, findings)
    return findings


def discover(path: Path) -> list[Path]:
    if (path / "SKILL.md").is_file():
        return [path]
    return sorted(item.parent for item in path.glob("*/SKILL.md"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    args = parser.parse_args()
    policy = load_json(POLICY_PATH)
    skills = discover(args.path)
    if not skills:
        print(f"FAIL no skills found under {args.path}")
        return 1
    failed = 0
    for skill_dir in skills:
        findings = validate_skill(skill_dir, policy)
        print(f"{'PASS' if not findings else 'FAIL'} {skill_dir}")
        for finding in findings:
            print(f"  {finding.code}: {finding.message}")
        failed += bool(findings)
    print(f"SUMMARY skills={len(skills)} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
