# Perspective Council Skill Standard

人物 Skill 是委员会的权威认知资产。`api/chat.js` 中的短 Prompt 只能作为历史占位符，不能作为生产人物定义。

## Directory layout

```text
skills/
├── public/
│   └── person-perspective/
│       ├── SKILL.md
│       ├── manifest.json
│       ├── references/
│       │   ├── source-ledger.json
│       │   ├── legacy/
│       │   │   └── SKILL.original.md
│       │   └── research/
│       │       ├── 01-writings.md
│       │       ├── 02-conversations.md
│       │       ├── 03-expression-dna.md
│       │       ├── 04-external-views.md
│       │       ├── 05-decisions.md
│       │       └── 06-timeline.md
│       └── tests/
│           ├── cases.json
│           └── results.json
└── private/
    └── amo-perspective/
```

`skills/private/` is ignored by Git. Raw Obsidian notes and the full Amo Skill must never enter the public repository.

## Admission rules

A `ready` Skill must satisfy every rule in `quality-policy.json`:

- six research dimensions exist;
- at least ten unique sources and more than half are primary;
- three to seven mental models, each with evidence, application and limitation;
- five to ten decision heuristics;
- an Agentic Protocol derived from the person's models;
- expression DNA, values, anti-patterns, two tensions and three honest boundaries;
- three known, one edge and one voice test with passing results;
- living people include a research cutoff and recent activity coverage.

Existing content is append-only during remediation. The original file is copied byte-for-byte to `references/legacy/`, and its SHA-256 is recorded in `manifest.json`.

## Commands

```bash
npm test
npm run validate:skills
python3 scripts/validate_skills.py skills/public/person-perspective
```
