#!/usr/bin/env python3
"""Create six-dimensional index views over preserved legacy research files."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

DIMENSIONS = {
    "01-writings.md": ("著作与系统思考", "提取本人著作、公开文本、反复出现的概念与思想演变。"),
    "02-conversations.md": ("长对话与即兴推理", "观察被追问、改变立场、拒绝回答和现场拆题的方式。"),
    "03-expression-dna.md": ("表达 DNA", "记录句式、节奏、类比、批评方式和可辨识的语言边界。"),
    "04-external-views.md": ("外部评价与反证", "收录支持、批评、争议与言行不一致，防止英雄化。"),
    "05-decisions.md": ("重大决策记录", "按情境、约束、选择、结果和可复用模式审视真实行动。"),
    "06-timeline.md": ("生平与思想时间线", "把公开经历、关键转折和思想变化放入时间顺序。"),
}

SOURCE_MAP = {
    "elon-musk-perspective": {
        "01-writings.md": ["Elon-Musk-思想体系调研-20260404.md", "research.md"],
        "02-conversations.md": ["马斯克即兴思考方式调研.md"],
        "03-expression-dna.md": ["马斯克即兴思考方式调研.md"],
        "04-external-views.md": ["Elon-Musk-思想体系调研-20260404.md", "research.md"],
        "05-decisions.md": ["马斯克决策模式与行为分析-20260404.md"],
        "06-timeline.md": ["马斯克决策模式与行为分析-20260404.md", "Elon-Musk-思想体系调研-20260404.md"],
    },
    "feynman-perspective": {
        "01-writings.md": ["费曼著作与系统思考调研-20260404.md"],
        "02-conversations.md": ["费曼长对话与即兴思考方式调研-20260404.md"],
        "03-expression-dna.md": ["费曼表达风格调研.md"],
        "04-external-views.md": ["费曼外部评价调研.md"],
        "05-decisions.md": ["费曼重大决策调研-20260404.md"],
        "06-timeline.md": ["费曼重大决策调研-20260404.md", "费曼著作与系统思考调研-20260404.md"],
    },
    "munger-perspective": {
        "01-writings.md": ["查理芒格思想体系深度调研-20260404.md", "25-biases.md"],
        "02-conversations.md": ["芒格表达风格DNA分析.md", "research.md"],
        "03-expression-dna.md": ["芒格表达风格DNA分析.md"],
        "04-external-views.md": ["查理芒格思想体系深度调研-20260404.md", "research.md"],
        "05-decisions.md": ["查理芒格思想体系深度调研-20260404.md"],
        "06-timeline.md": ["查理芒格思想体系深度调研-20260404.md", "research.md"],
    },
    "naval-perspective": {
        "01-writings.md": ["naval-ravikant-agent1-著作与系统思考.md"],
        "02-conversations.md": ["naval-agent2-conversations.md"],
        "03-expression-dna.md": ["naval-agent3-expression-dna.md"],
        "04-external-views.md": ["naval-agent2-conversations.md", "quality-validation.md"],
        "05-decisions.md": ["naval-ravikant-agent1-著作与系统思考.md", "naval-agent2-conversations.md"],
        "06-timeline.md": ["naval-ravikant-agent1-著作与系统思考.md"],
    },
    "taleb-perspective": {
        "01-writings.md": ["塔勒布思想体系调研.md"],
        "02-conversations.md": ["塔勒布深度对话调研.md"],
        "03-expression-dna.md": ["塔勒布碎片表达与社交媒体人格调研.md"],
        "04-external-views.md": ["塔勒布外部批评调研.md"],
        "05-decisions.md": ["塔勒布重大决策与实际行动调研-20260404.md"],
        "06-timeline.md": ["塔勒布思想体系调研.md", "塔勒布重大决策与实际行动调研-20260404.md"],
    },
}


def render(filename: str, sources: list[str]) -> str:
    title, scope = DIMENSIONS[filename]
    links = "\n".join(f"- [完整原始材料](../{source})" for source in sources)
    return f"""<!-- generated-research-view -->
# {title}

> 标准化研究入口，不替代或压缩原始材料。引用文件必须由质量验证器完整计入。

## 本维度审查范围

{scope}

## 完整材料

{links}

## 使用约束

- 结论必须回到上列原始材料核对，不得仅根据本索引生成事实。
- 一手陈述、二手评价与研究者推断必须在回答中区分。
- 与其他维度冲突时保留张力，不做无证据的统一化解释。
"""


def main() -> None:
    for skill, mapping in SOURCE_MAP.items():
        references = ROOT / "skills" / "public" / skill / "references"
        research = references / "research"
        research.mkdir(exist_ok=True)
        for filename, sources in mapping.items():
            missing = [source for source in sources if not (references / source).is_file()]
            if missing:
                raise FileNotFoundError(f"{skill}/{filename}: {missing}")
            destination = research / filename
            if destination.exists() and "generated-research-view" not in destination.read_text(encoding="utf-8"):
                raise FileExistsError(f"refusing to replace authored file: {destination}")
            destination.write_text(render(filename, sources), encoding="utf-8")


if __name__ == "__main__":
    main()
