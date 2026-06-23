import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_skills import ROOT, load_json, validate_skill


POLICY = load_json(ROOT / "skills" / "quality-policy.json")


VALID_SKILL = """---
name: fixture-perspective
description: Fixture person perspective.
---
# Fixture
## 回答工作流（Agentic Protocol）
### Step 1: classify
### Step 2: research
### Step 3: answer
## 核心心智模型
### 模型1: A
证据：two domains. 应用：decisions. 局限：context.
### 模型2: B
证据：two domains. 应用：decisions. 局限：context.
### 模型3: C
证据：two domains. 应用：decisions. 局限：context.
## 决策启发式
1. one
2. two
3. three
4. four
5. five
## 表达DNA
specific style
## 价值观与反模式
values and anti-patterns
## 内在张力
- tension one
- tension two
## 诚实边界
- boundary one
- boundary two
- boundary three
## 调研来源
See ledger.
"""


class SkillValidatorTests(unittest.TestCase):
    def make_skill(self, root: Path, *, primary_count: int = 6) -> Path:
        skill = root / "fixture-perspective"
        research = skill / "references" / "research"
        legacy = skill / "references" / "legacy"
        tests = skill / "tests"
        research.mkdir(parents=True)
        legacy.mkdir(parents=True)
        tests.mkdir(parents=True)
        (skill / "SKILL.md").write_text(VALID_SKILL, encoding="utf-8")
        original = legacy / "SKILL.original.md"
        original.write_text("original", encoding="utf-8")
        original_hash = hashlib.sha256(original.read_bytes()).hexdigest()
        manifest = {
            "schema_version": 1,
            "slug": "fixture-perspective",
            "display_name": "Fixture",
            "status": "testing",
            "privacy": "public",
            "living_person": False,
            "research_cutoff": "2026-06-22",
            "legacy_sha256": original_hash,
        }
        (skill / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        for filename in POLICY["required_research_files"]:
            (research / filename).write_text("research", encoding="utf-8")
        sources = []
        for index in range(10):
            sources.append({
                "id": f"S{index + 1}",
                "title": f"Source {index + 1}",
                "url": f"https://example.com/{index + 1}",
                "type": "primary" if index < primary_count else "secondary",
                "dimensions": ["writings"],
            })
        (skill / "references" / "source-ledger.json").write_text(
            json.dumps({"schema_version": 1, "sources": sources}), encoding="utf-8"
        )
        cases = [
            {"id": "K1", "type": "known"},
            {"id": "K2", "type": "known"},
            {"id": "K3", "type": "known"},
            {"id": "E1", "type": "edge"},
            {"id": "V1", "type": "voice"},
        ]
        (tests / "cases.json").write_text(json.dumps({"cases": cases}), encoding="utf-8")
        return skill

    def test_valid_skill_passes(self):
        with tempfile.TemporaryDirectory() as value:
            skill = self.make_skill(Path(value))
            self.assertEqual([], validate_skill(skill, POLICY))

    def test_primary_ratio_must_be_strictly_over_half(self):
        with tempfile.TemporaryDirectory() as value:
            skill = self.make_skill(Path(value), primary_count=5)
            codes = {finding.code for finding in validate_skill(skill, POLICY)}
            self.assertIn("sources.primary_ratio", codes)

    def test_missing_model_limitation_fails(self):
        with tempfile.TemporaryDirectory() as value:
            skill = self.make_skill(Path(value))
            path = skill / "SKILL.md"
            path.write_text(path.read_text().replace("局限：context.", "", 1), encoding="utf-8")
            codes = {finding.code for finding in validate_skill(skill, POLICY)}
            self.assertIn("models.limitation", codes)

    def test_legacy_hash_mismatch_fails(self):
        with tempfile.TemporaryDirectory() as value:
            skill = self.make_skill(Path(value))
            (skill / "references" / "legacy" / "SKILL.original.md").write_text("changed")
            codes = {finding.code for finding in validate_skill(skill, POLICY)}
            self.assertIn("legacy.hash", codes)

    def test_missing_research_dimension_fails(self):
        with tempfile.TemporaryDirectory() as value:
            skill = self.make_skill(Path(value))
            (skill / "references" / "research" / "04-external-views.md").unlink()
            codes = {finding.code for finding in validate_skill(skill, POLICY)}
            self.assertIn("research.missing", codes)

    def test_generated_research_view_requires_real_material(self):
        with tempfile.TemporaryDirectory() as value:
            skill = self.make_skill(Path(value))
            path = skill / "references" / "research" / "01-writings.md"
            path.write_text(
                "<!-- generated-research-view -->\n[完整原始材料](../missing.md)\n",
                encoding="utf-8",
            )
            codes = {finding.code for finding in validate_skill(skill, POLICY)}
            self.assertIn("research.references", codes)

    def test_missing_boundaries_and_tensions_fail(self):
        with tempfile.TemporaryDirectory() as value:
            skill = self.make_skill(Path(value))
            path = skill / "SKILL.md"
            content = path.read_text()
            content = content.replace("- tension two\n", "").replace("- boundary three\n", "")
            path.write_text(content)
            codes = {finding.code for finding in validate_skill(skill, POLICY)}
            self.assertIn("tensions.count", codes)
            self.assertIn("boundaries.count", codes)

    def test_required_test_mix_is_enforced(self):
        with tempfile.TemporaryDirectory() as value:
            skill = self.make_skill(Path(value))
            cases_path = skill / "tests" / "cases.json"
            cases = json.loads(cases_path.read_text())
            cases["cases"] = [case for case in cases["cases"] if case["type"] != "voice"]
            cases_path.write_text(json.dumps(cases))
            codes = {finding.code for finding in validate_skill(skill, POLICY)}
            self.assertIn("tests.count", codes)

    def test_ready_skill_requires_passing_results(self):
        with tempfile.TemporaryDirectory() as value:
            skill = self.make_skill(Path(value))
            manifest_path = skill / "manifest.json"
            manifest = json.loads(manifest_path.read_text())
            manifest["status"] = "ready"
            manifest_path.write_text(json.dumps(manifest))
            codes = {finding.code for finding in validate_skill(skill, POLICY)}
            self.assertIn("tests.results", codes)

    def test_living_person_requires_recent_activity_section(self):
        with tempfile.TemporaryDirectory() as value:
            skill = self.make_skill(Path(value))
            manifest_path = skill / "manifest.json"
            manifest = json.loads(manifest_path.read_text())
            manifest["living_person"] = True
            manifest_path.write_text(json.dumps(manifest))
            codes = {finding.code for finding in validate_skill(skill, POLICY)}
            self.assertIn("research.recent_activity", codes)


if __name__ == "__main__":
    unittest.main()
