import { ChevronLeft, LogIn, Star, User } from 'lucide-react'

export default function Header({ page, onNavigate, user, favoritesCount = 0, onLogin, onLogout }) {
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
              <span className="text-sm font-semibold text-white">智小库</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('favorites')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all ${
              page === 'favorites'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="查看收藏夹"
          >
            <Star size={16} className={favoritesCount ? 'fill-amber-300 text-amber-300' : ''} />
            <span className="hidden sm:inline">收藏夹</span>
            {favoritesCount > 0 && <span className="text-xs text-slate-500">{favoritesCount}</span>}
          </button>
          {user ? (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              title="退出登录"
            >
              <User size={16} />
              <span className="hidden sm:inline">{user.name}</span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">登录</span>
            </button>
          )}
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
