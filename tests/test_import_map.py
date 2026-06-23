import json
import unittest
from urllib.parse import urlparse

from scripts.validate_skills import ROOT


class ImportMapTests(unittest.TestCase):
    def test_public_skill_directories_match_import_map(self):
        public_root = ROOT / "skills" / "public"
        public_slugs = {
            item.name
            for item in public_root.iterdir()
            if item.is_dir() and (item / "SKILL.md").is_file()
        }

        import_map = json.loads((ROOT / "skills" / "import-map.json").read_text(encoding="utf-8"))
        indexed_slugs = {item["slug"] for item in import_map["skills"]}

        self.assertEqual(public_slugs, indexed_slugs)

    def test_public_source_ledgers_exclude_blacklisted_domains(self):
        blacklisted_domains = {
            "zhihu.com",
            "www.zhihu.com",
            "mp.weixin.qq.com",
            "baike.baidu.com",
        }

        for ledger_path in (ROOT / "skills" / "public").glob("*/references/source-ledger.json"):
            with self.subTest(ledger=ledger_path):
                ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
                domains = {
                    urlparse(source["url"]).netloc.lower()
                    for source in ledger.get("sources", [])
                }
                self.assertFalse(domains & blacklisted_domains)

    def test_public_runtime_excludes_private_amo_context(self):
        checked_paths = [
            ROOT / "api" / "chat.js",
            ROOT / "src" / "lib" / "scenarios.js",
            ROOT / "src" / "lib" / "prompts.js",
            ROOT / "README.md",
        ]
        blocked_terms = [
            "阿莫",
            "王雪松",
            "local.obsidian",
            "/Users/wangxuesong/obsidian",
            "1688联营",
            "1688 联营",
        ]

        for path in checked_paths:
            with self.subTest(path=path):
                text = path.read_text(encoding="utf-8")
                for term in blocked_terms:
                    self.assertNotIn(term, text)


if __name__ == "__main__":
    unittest.main()
