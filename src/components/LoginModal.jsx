import { useState } from 'react'
import { X } from 'lucide-react'

export default function LoginModal({ onClose, onSubmit }) {
  const [name, setName] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit({ id: trimmed.toLowerCase(), name: trimmed })
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">登录智小库</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          当前版本使用本地登录态保存收藏对话；同一浏览器内按账号名称区分收藏夹。
        </p>
        <label className="mt-5 block text-xs text-slate-500">账号名称</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60"
          placeholder="输入你的名字或账号"
        />
        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-500 hover:to-purple-500 transition-all"
        >
          登录并保存收藏
        </button>
      </form>
    </div>
  )
}
