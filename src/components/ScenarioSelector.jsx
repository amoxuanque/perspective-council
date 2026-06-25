import { scenarios } from '../lib/scenarios'

export default function ScenarioSelector({ onSelect }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      {/* Title */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <span className="text-blue-400">✦</span>
          <span className="gradient-text">选择共创场景</span>
          <span className="text-blue-400">✦</span>
        </h2>
        <p className="text-sm text-slate-400 mt-3">
          10个精心设计的决策场景，汇聚各领域顶尖思维
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`glow-card glow-${s.color} p-5 text-left group cursor-pointer`}
          >
            {/* Number */}
            <span className="text-xs font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
              {s.number}
            </span>

            {/* Icon */}
            <div className="mt-3 mb-4 flex justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background: `radial-gradient(circle, ${getColorValue(s.color)}15, transparent)`,
                  border: `1px solid ${getColorValue(s.color)}30`,
                }}
              >
                {s.icon}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold text-white text-center mb-2">{s.title}</h3>

            {/* Description */}
            <p className="text-xs text-slate-400 text-center leading-relaxed line-clamp-2">{s.desc}</p>

            {/* Members */}
            <div className="mt-4 flex flex-wrap justify-center gap-1">
              {s.members.slice(0, 3).map(name => (
                <span
                  key={name}
                  className="text-[10px] px-1.5 py-0.5 rounded border text-slate-400 border-white/10"
                >
                  {name}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-12">
        <p className="text-xs text-slate-600">
          智小库 · AI Decision System
        </p>
      </div>
    </div>
  )
}

function getColorValue(color) {
  const map = {
    purple: '#a855f7',
    blue: '#3b82f6',
    cyan: '#06b6d4',
    green: '#10b981',
    orange: '#f59e0b',
    red: '#ef4444',
    pink: '#ec4899',
    indigo: '#6366f1',
  }
  return map[color] || '#3b82f6'
}
