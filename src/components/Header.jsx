import { ChevronLeft } from 'lucide-react'

export default function Header({ page, onNavigate }) {
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          {page !== 'landing' && (
            <button
              onClick={() => onNavigate(page === 'chat' ? 'scenarios' : 'landing')}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors mr-1"
            >
              <ChevronLeft size={20} className="text-slate-300" />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 0 20"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold text-white">Perspective Council</span>
              <span className="text-xs text-slate-400 ml-1 hidden sm:inline">视角委员会</span>
            </div>
          </div>

          {page === 'landing' && (
            <nav className="hidden lg:flex items-center gap-6">
              {['产品', '解决方案', '核心能力', '技术架构', '定价', '关于我们'].map(item => (
                <a key={item} className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
                  {item}
                </a>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">中 / EN</span>
          <button
            onClick={() => onNavigate('scenarios')}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
          >
            开始使用
          </button>
        </div>
      </div>
    </header>
  )
}
