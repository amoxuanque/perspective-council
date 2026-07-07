// Vercel Serverless Function - Discussion Engine
// This file handles the multi-model discussion orchestration

const MODEL_MAP = {
  'DeepSeek-V3.2': 'claude-sonnet-4-5-20250929',
  'Qwen3.5-397B': 'claude-sonnet-4-5-20250929',
  'GLM-5.2': 'claude-sonnet-4-5-20250929',
  'DeepSeek-V4-Pro': 'claude-sonnet-4-5-20250929',
  'MiniMax-M2.5': 'claude-sonnet-4-5-20250929',
  'Qwen3-32B': 'claude-sonnet-4-5-20250929',
  'Pro/DeepSeek-R1': 'claude-opus-4-6-thinking'
};

const PERSON_MODEL = {
  '贝佐斯': 'DeepSeek-V3.2',
  '达利欧': 'DeepSeek-V3.2',
  '芒格': 'Qwen3.5-397B',
  '塔勒布': 'Qwen3.5-397B',
  '曾鸣': 'GLM-5.2',
  '俞军': 'GLM-5.2',
  '克里斯坦森': 'DeepSeek-V4-Pro',
  '张一鸣': 'DeepSeek-V4-Pro',
  '乔布斯': 'DeepSeek-V4-Pro',
  'Naval': 'MiniMax-M2.5',
  'PG': 'MiniMax-M2.5',
  '费曼': 'MiniMax-M2.5',
  '马斯克': 'Qwen3-32B',
  'Karpathy': 'Qwen3-32B',
  'MrBeast': 'Qwen3-32B',
};

const PROMPTS = {
  '贝佐斯': '你是Jeff Bezos，亚马逊创始人。用飞轮思维、Customer Obsession、Day 1心态、Input Metrics、Type 1/Type 2门决策框架分析问题。表达风格：数据先行，从客户倒推，反复强调长期主义和机制大于意志力。',
  '芒格': '你是查理·芒格，伯克希尔副董事长。用逆向思考、多元思维模型、激励结构分析、Lollapalooza效应、能力圈框架分析问题。表达风格：毒舌、讽刺、引用历史案例，先说“反过来想”。',
  '曾鸣': '你是曾鸣，阿里巴巴前首席战略官。用点线面体、S2B2C、网络协同+数据智能双螺旋、看十年做一年、终局思维分析问题。表达风格：学者型战略家。',
  '俞军': '你是俞军，百度贴吧之父/滴滴前产品VP。用用户价值公式(新体验-旧体验-替换成本)、交易模型、相对价格分析问题。表达风格：公式先行、定义先于讨论、极度压缩。',
  '克里斯坦森': '你是Clayton Christensen，哈佛商学院教授。用颠覆式创新动力学、Jobs to Be Done、RPV框架、性能过剩与模块化分析问题。表达风格：故事先行、苏格拉底式引导。',
  '达利欧': '你是Ray Dalio，桥水基金创始人。用Pain+Reflection=Progress、Idea Meritocracy、经济机器模型、Big Cycle、5-Step Process分析问题。表达风格：原则化、机器隱喻、概率化。',
  '塔勒布': '你是Nassim Taleb。用反脆弱/凸性、黑天鹅风险、Skin in the Game、杠铃策略、Lindy效应分析问题。表达风格：攻击性强、蔑视预测。',
  'Naval': '你是Naval Ravikant。用特定知识+杠杆+判断力、Productize Yourself、Wealth vs Money分析问题。表达风格：格言体、推文密度。',
  '张一鸣': '你是张一鸣，字节跳动创始人。用Delay Gratification、数据驱动+A/B Test一切、Context not Control分析问题。表达风格：克制、理性、反情绪化。',
  '乔布斯': '你是Steve Jobs。用集成思维、千人说NO、品味即战略、Reality Distortion Field分析问题。表达风格：极简、直觉判断、品味至上。',
  '费曼': '你是Richard Feynman。用费曼验证法(命名≠理解)、Cargo Cult检测、多表征转换分析问题。表达风格：好奇、playful、反权威。',
  '马斯克': '你是Elon Musk。用第一性原理成本拆解、白痴指数、五步算法(删除→简化→加速→自动化→质疑需求)分析问题。表达风格：极度直接。',
  'Karpathy': '你是Andrej Karpathy。用Software 2.0/3.0、March of Nines、构建即理解、工程现实主义分析问题。表达风格：技术深度+通俗比喻。',
  'PG': '你是Paul Graham。用Do Things That Don\'t Scale、Startup=Growth、写作即思考分析问题。表达风格：essay体、简洁有力。',
  'MrBeast': '你是MrBeast。用1秒定律、A/B Test缩略图+标题、Re-engagement Loop、留存曲线分析问题。表达风格：极度关注数据和执行。',
};

const SCENARIO_SEATS = {
  'product': ['主席', '质询', '挑战', '平衡', '品味'],
  'mechanism': ['主席', '质询', '模型', '验证', '用户'],
  'strategy': ['主席', '颠覆', '飞轮', '风险', '周期'],
  'growth': ['主席', '价值', '杠杆', '网络', '激励'],
  'risk': ['主席', '黑天鹅', '压测', '颠覆', '门型'],
  'report': ['结构', '简化', '冲击', '机制'],
  'ai': ['技术', '产品', '数据', '颠覆', '反脆弱'],
  'org': ['主席', '速度', '组织', '激励', '杠杆'],
  'customer': ['价值', '痴迷', '雇佣', '网络', '系统'],
  'content': ['写作', '简化', '品味', '留存'],
};

const SCENARIO_MEMBERS = {
  'product': ['俞军', '克里斯坦森', '贝佐斯', '张一鸣', '乔布斯'],
  'mechanism': ['贝佐斯', '芒格', '曾鸣', '达利欧', '俞军'],
  'strategy': ['曾鸣', '克里斯坦森', '贝佐斯', '塔勒布', '达利欧'],
  'growth': ['贝佐斯', '俞军', 'Naval', '曾鸣', '芒格'],
  'risk': ['芒格', '塔勒布', '达利欧', '克里斯坦森', '贝佐斯'],
  'report': ['贝佐斯', '费曼', '马斯克', 'PG'],
  'ai': ['Karpathy', '俞军', '张一鸣', '克里斯坦森', '塔勒布'],
  'org': ['达利欧', '贝佐斯', '张一鸣', '芒格', 'Naval'],
  'customer': ['俞军', '贝佐斯', '克里斯坦森', '曾鸣', '达利欧'],
  'content': ['PG', '费曼', '乔布斯', 'MrBeast'],
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function mapSettledWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = { status: 'fulfilled', value: await task(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function callModel(name, messages, temperature = 0.6) {
  const modelKey = name === '裁决官' ? 'Pro/DeepSeek-R1' : (PERSON_MODEL[name] || 'GLM-5.2');
  const modelId = MODEL_MAP[modelKey];
  const apiBase = (process.env.AI_API_BASE || 'https://api.siliconflow.cn/v1').replace(/\/$/, '');
  const apiKey = process.env.AI_API_KEY || process.env.SILICONFLOW_API_KEY;

  if (!apiKey) {
    throw new Error(`API Error (${name}/${modelKey}): missing AI_API_KEY or SILICONFLOW_API_KEY`);
  }
  
  let resp;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    resp = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: modelId, messages, temperature, max_tokens: 800, stream: false })
    });

    if (resp.ok) break;
    const err = await resp.text();
    const retryable = [429, 500, 502, 503, 504].includes(resp.status);
    if (!retryable || attempt === 2) {
      throw new Error(`API Error (${name}/${modelKey}): ${resp.status} - ${err.slice(0, 100)}`);
    }
    const retryAfter = Number(resp.headers.get('retry-after')) * 1000;
    const backoff = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter
      : 1200 * (2 ** attempt) + Math.floor(Math.random() * 600);
    await sleep(backoff);
  }
  
  const data = await resp.json();
  let content = data.choices[0].message.content || '';
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return content;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { scenario, question, context, mode = 'standard', history = [] } = req.body;
  if (!scenario || !question) return res.status(400).json({ error: 'Missing scenario or question' });

  const members = SCENARIO_MEMBERS[scenario] || SCENARIO_MEMBERS['product'];
  const seats = SCENARIO_SEATS[scenario] || [];

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const heartbeat = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 8000);

  function send(data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  function finish() {
    clearInterval(heartbeat);
    res.write('data: [DONE]\n\n');
    res.end();
  }

  try {
    const topicWithContext = context ? `${question}\n\n[参考材料]:\n${context.slice(0, 6000)}` : question;

    // === ROUND 1: 独立陈述 ===
    send({ round: 1, title: 'Round 1 · 独立陈述', speakers: [] });
    
    const r1Results = await mapSettledWithConcurrency(members, 2, async (name, i) => {
      const seat = seats[i] || '委员';
      const temp = seat === '主席' ? 0.3 : ['质询','黑天鹅','颠覆'].includes(seat) ? 0.9 : 0.6;
      const sysPrompt = (PROMPTS[name] || `你是${name}。`) + '\n\n【输出要求】直接给出独立判断，≤200字，必须明确表态（支持/反对/有条件支持）。先一句话表态，再给核心理由。';
      const text = await callModel(name, [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: `议题：${topicWithContext}\n\n请从你的核心框架给出独立判断。` }
      ], temp);
      const speaker = { name, seat, text };
      send({ speaker });
      return speaker;
    });

    const round1 = r1Results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      const speaker = { name: members[i], seat: seats[i] || '委员', text: `调用失败：${r.reason?.message || 'unknown error'}` };
      send({ speaker });
      return speaker;
    });

    if (mode === 'quick') {
      // Skip to Round 4+5
      await runConsensusAndArbitration(send, members, seats, round1, [], [], topicWithContext);
      send({ done: true });
      return finish();
    }

    // === ROUND 2: 交叉质询 ===
    send({ round: 2, title: 'Round 2 · 交叉质询', speakers: [] });
    const r1Summary = round1.map(r => `【${r.name}】(${r.seat}): ${r.text}`).join('\n\n');
    
    const r2Results = await mapSettledWithConcurrency(members, 2, async (name, i) => {
      const seat = seats[i] || '委员';
      const sysPrompt = (PROMPTS[name] || '') + '\n\n【输出要求】选择1-2位你最不同意的委员，提出最锐利的质疑（≤150字）。格式：→ [对方名字]：[质疑问题]';
      const text = await callModel(name, [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: `Round 1各委员陈述：\n\n${r1Summary}\n\n你是${name}，请提出质疑。` }
      ], 0.8);
      const speaker = { name, seat, text };
      send({ speaker });
      return speaker;
    });

    const round2 = r2Results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      const speaker = { name: members[i], seat: seats[i] || '委员', text: `调用失败：${r.reason?.message || 'unknown error'}` };
      send({ speaker });
      return speaker;
    });

    // === ROUND 3: 回应与修正 ===
    send({ round: 3, title: 'Round 3 · 回应与修正', speakers: [] });
    const r2Summary = round2.map(r => `【${r.name}质疑】: ${r.text}`).join('\n\n');

    const r3Results = await mapSettledWithConcurrency(members, 2, async (name, i) => {
      const seat = seats[i] || '委员';
      const sysPrompt = (PROMPTS[name] || '') + '\n\n【输出要求】回应质疑（≤150字）：坚持原判断并补充论据，或承认盲区并修正立场。';
      const myR1 = round1.find(r => r.name === name)?.text || '';
      const text = await callModel(name, [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: `你在Round 1的陈述：${myR1}\n\n收到的质疑：\n${r2Summary}\n\n请回应针对你的质疑。` }
      ], 0.6);
      const speaker = { name, seat, text };
      send({ speaker });
      return speaker;
    });

    const round3 = r3Results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      const speaker = { name: members[i], seat: seats[i] || '委员', text: `调用失败：${r.reason?.message || 'unknown error'}` };
      send({ speaker });
      return speaker;
    });

    // === ROUND 4+5 ===
    await runConsensusAndArbitration(send, members, seats, round1, round2, round3, topicWithContext);

  } catch (err) {
    send({ error: err.message });
  }

  finish();
}

async function runConsensusAndArbitration(send, members, seats, round1, round2, round3, topic) {
  let fullDiscussion = `议题：${topic}\n\n=== Round 1 ===\n${round1.map(r => `【${r.name}】: ${r.text}`).join('\n\n')}`;
  if (round2.length) fullDiscussion += `\n\n=== Round 2 ===\n${round2.map(r => `【${r.name}】: ${r.text}`).join('\n\n')}`;
  if (round3.length) fullDiscussion += `\n\n=== Round 3 ===\n${round3.map(r => `【${r.name}】: ${r.text}`).join('\n\n')}`;

  // Round 4: 主席凝练共识
  send({ round: 4, title: 'Round 4 · 共识凝练', speakers: [] });
  const chairman = members[0];
  const chairPrompt = (PROMPTS[chairman] || '') + '\n\n你是本次讨论的主席，请总结讨论结果。格式：\n## 共识区\n- ...\n## 分歧区\n- ...\n## 关键洞见\n- ...';
  
  const r4Text = await callModel(chairman, [
    { role: 'system', content: chairPrompt },
    { role: 'user', content: fullDiscussion + '\n\n请作为主席总结。' }
  ], 0.3);
  send({ speaker: { name: chairman + '（主席）', seat: '总结', text: r4Text } });

  // Round 5: 裁决
  send({ round: 5, title: 'Round 5 · 裁决建议 ⭐', speakers: [] });
  const arbPrompt = '你是一个独立的决策裁决官。基于全部讨论记录，提炼出清晰的决议选项供决策者裁决。\n\n输出格式：\n## 🎯 决议事项\n### 决议1：[具体问题]\n- **选项A**：[方案] — 支持者：[...]\n- **选项B**：[方案] — 支持者：[...]\n- **委员会建议**：[倾向]\n- ⚠️ **风险提示**：[...]\n\n---\n💡 **等待您的裁决。**';

  const r5Text = await callModel('裁决官', [
    { role: 'system', content: arbPrompt },
    { role: 'user', content: fullDiscussion + '\n\n主席总结：\n' + r4Text }
  ], 0.4);
  send({ speaker: { name: '🏛️ 裁决官', seat: '独立裁决', text: r5Text } });
}
