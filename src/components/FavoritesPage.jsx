import MessageBubble from './MessageBubble'

export default function FavoritesPage({ user, favorites, onLogin, onToggleFavorite }) {
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center animate-fade-in">
        <h2 className="text-3xl font-bold text-white">收藏夹</h2>
        <p className="mt-3 text-sm text-slate-400">登录后可以保存和查看你的收藏对话。</p>
        <button
          onClick={onLogin}
          className="mt-8 px-5 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-medium text-white hover:from-blue-500 hover:to-purple-500 transition-all"
        >
          登录后查看
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">收藏夹</h2>
        <p className="mt-2 text-sm text-slate-400">
          {favorites.length ? `已收藏 ${favorites.length} 条问答` : '还没有收藏问答'}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-slate-500">
          在对话回答右上角点击星标，即可保存到收藏夹。
        </div>
      ) : (
        <div className="space-y-6">
          {favorites.map(item => (
            <MessageBubble
              key={item.id}
              message={item}
              isFavorite
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  )
}
