import { ArrowRight, Play } from 'lucide-react'

const AGENTS = [
  { name: '分析师', en: 'Analyst', desc: '数据驱动·逻辑分析', color: '#a855f7', angle: -60 },
  { name: '创新者', en: 'Innovator', desc: '创新思维·突破边界', color: '#10b981', angle: 0 },
  { name: '战略家', en: 'Strategist', desc: '全局视野·战略思考', color: '#3b82f6', angle: -120 },
  { name: '风险官', en: 'Risk Officer', desc: '风险识别·稳健决策', color: '#06b6d4', angle: 60 },
  { name: '用户代表', en: 'User Advocate', desc: '用户视角·需求洞察', color: '#f59e0b', angle: 180 },
  { name: '批判者', en: 'Critic', desc: '批判思维·反向验证', color: '#ec4899', angle: 120 },
]

const ROUNDS = [
  { id: 'R1', title: '问题定义', desc: '明确问题边界与目标，确保所有智能体对问题有共同理解。', icon: '📋' },
  { id: 'R2', title: '观点提出', desc: '每个智能体基于自身专长提出独立观点和初步分析，不受他人影响。', icon: '💡' },
  { id: 'R3', title: '观点辩论', desc: '智能体之间相互质询，辩论挑战假设，发现盲点，深化对问题的理解。', icon: '💬' },
  { id: 'R4', title: '观点整合', desc: '整合各方观点，识别共识与分歧，提炼关键洞察和可行方案。', icon: '🔀' },
  { id: 'R5', title: '决策输出', desc: '形成最终建议，明确行动方案与理由，输出结构化决策报告。', icon: '✅' },
]

const FEATURES = [
  { title: '多元视角', desc: '6位专家，多维度思考', icon: '👥' },
  { title: '深度辩论', desc: '结构化辩论，挑战假设', icon: '🔗' },
  { title: '降低偏见', desc: '打破认知偏见，提高决策质量', icon: '💬' },
  { title: '可追溯性', desc: '完整讨论过程，可追溯可验证', icon: '📄' },
  { title: '持续进化', desc: '基于反馈不断学习与优化', icon: '🔄' },
]

export default function LandingPage({ onStart }) {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              <span className="text-white">Perspective</span><br/>
              <span className="text-white">Council</span>
              <span className="gradient-text text-4xl lg:text-5xl ml-3">视角委员会</span>
            </h1>
            <p className="mt-6 text-xl text-slate-300 leading-relaxed">
              多智能体共创系统 — 让不同思维框架碰撞出更好的决策
            </p>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-lg">
              Perspective Council 是一个多智能体 AI 决策系统，模拟由不同专业背景和思维方式的专家组成的虚拟委员会，通过结构化的多轮讨论与辩论，突破认知局限，为您提供更全面、更客观、更高质量的决策建议。
            </p>
            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25"
              >
                立即体验 <ArrowRight size={18} />
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-all">
                了解更多 <Play size={16} />
              </button>
            </div>
          </div>

          {/* Right: Agent Visualization */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-[400px] h-[400px]">
              {/* Center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-blue-500/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">6位</div>
                  <div className="text-xs text-blue-300">AI 智能体</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">多维视角·深度思考·共创决策</div>
                </div>
              </div>
              {/* Connection rings */}
              <div className="absolute inset-8 rounded-full border border-blue-500/10 animate-glow-pulse"></div>
              <div className="absolute inset-16 rounded-full border border-purple-500/10"></div>
              {/* Agent nodes */}
              {AGENTS.map((agent, i) => {
                const radius = 160
                const rad = (agent.angle * Math.PI) / 180
                const x = 200 + radius * Math.cos(rad) - 44
                const y = 200 + radius * Math.sin(rad) - 44
                return (
                  <div
                    key={i}
                    className="absolute w-22 flex flex-col items-center animate-float"
                    style={{ left: x, top: y, animationDelay: `${i * 0.5}s` }}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center border-2"
                      style={{ borderColor: agent.color, boxShadow: `0 0 20px ${agent.color}40` }}
                    >
                      <span className="text-lg">{agent.name[0]}</span>
                    </div>
                    <span className="text-[11px] text-slate-200 mt-1 font-medium whitespace-nowrap">{agent.name}</span>
                    <span className="text-[9px] text-slate-500 whitespace-nowrap">{agent.en}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="border-t border-white/5 bg-navy-950/50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <span className="text-blue-400">✦</span> 五轮讨论协议 <span className="text-blue-400">✦</span>
            </h2>
            <p className="text-sm text-slate-400 mt-2">结构化的多轮讨论，层层深入，收敛共识</p>
          </div>

          {/* Timeline */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {ROUNDS.map((r, i) => (
              <div key={r.id} className="flex items-center">
                <div className="w-12 h-12 rounded-full border-2 border-blue-500/60 bg-navy-900 flex items-center justify-center text-sm font-bold text-blue-300">
                  {r.id}
                </div>
                {i < ROUNDS.length - 1 && (
                  <div className="w-16 lg:w-24 h-0.5 bg-gradient-to-r from-blue-500/60 to-blue-500/20"></div>
                )}
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {ROUNDS.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-navy-900/80 border border-white/5">
                <div className="text-2xl mb-2">{r.icon}</div>
                <div className="font-medium text-sm text-white">{r.title}</div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{f.title}</div>
                  <div className="text-xs text-slate-500">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
