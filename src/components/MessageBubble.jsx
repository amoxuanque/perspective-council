import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Download, Star } from 'lucide-react'
import { toPng } from 'html-to-image'
import { persons } from '../lib/prompts'

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

export default function MessageBubble({ message, isFavorite = false, onToggleFavorite, compact = false }) {
  const exportRef = useRef(null)
  const [actionText, setActionText] = useState('')

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm shadow-lg shadow-blue-500/10">
          {message.content}
          {message.files?.length > 0 && (
            <div className="mt-1.5 text-blue-100 text-xs opacity-80">📄 {message.files.join(', ')}</div>
          )}
        </div>
      </div>
    )
  }

  const filename = `perspective-council-${new Date().toISOString().slice(0, 10)}.png`

  const renderPng = async () => {
    if (!exportRef.current) return null
    return toPng(exportRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#0a0e1a',
      filter: node => node?.dataset?.exportHide !== 'true'
    })
  }

  const handleSavePng = async () => {
    try {
      const dataUrl = await renderPng()
      if (!dataUrl) return
      downloadDataUrl(dataUrl, filename)
      setActionText('已保存')
    } catch {
      setActionText('保存失败')
    }
  }

  const handleCopyPng = async () => {
    try {
      const dataUrl = await renderPng()
      if (!dataUrl) return
      const blob = dataUrlToBlob(dataUrl)
      if (!navigator.clipboard?.write || !window.ClipboardItem) {
        downloadDataUrl(dataUrl, filename)
        setActionText('已下载')
        return
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setActionText('已复制')
    } catch {
      setActionText('复制失败')
    }
  }

  if (message.error) {
    return (
      <div className="animate-fade-in space-y-2">
        <div data-export-hide="true" className="flex justify-end gap-1.5">
          {message.question && (
            <>
              <button onClick={handleCopyPng} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-slate-100" title="复制为 PNG">
                <Copy size={14} />
              </button>
              <button onClick={handleSavePng} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-slate-100" title="保存为 PNG">
                <Download size={14} />
              </button>
              <button onClick={() => onToggleFavorite?.(message)} className={`p-1.5 rounded-lg bg-white/5 ${isFavorite ? 'text-amber-300' : 'text-slate-400 hover:text-slate-100'}`} title="收藏问答">
                <Star size={14} className={isFavorite ? 'fill-amber-300' : ''} />
              </button>
            </>
          )}
        </div>
        <div ref={exportRef} className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          {message.question && (
            <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-slate-200">
              <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">问题</div>
              <div>{message.question}</div>
            </div>
          )}
          ⚠️ {message.error}
        </div>
      </div>
    )
  }

  // Assistant message with rounds
  return (
    <div className={`animate-fade-in space-y-3 ${compact ? 'text-[13px]' : ''}`}>
      {message.question && (
        <div data-export-hide="true" className="flex items-center justify-end gap-1.5">
          {actionText && <span className="mr-1 text-[11px] text-slate-500">{actionText}</span>}
          <button onClick={handleCopyPng} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100" title="复制为 PNG">
            <Copy size={14} />
          </button>
          <button onClick={handleSavePng} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100" title="保存为 PNG">
            <Download size={14} />
          </button>
          <button onClick={() => onToggleFavorite?.(message)} className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 ${isFavorite ? 'text-amber-300' : 'text-slate-400 hover:text-slate-100'}`} title="收藏问答">
            <Star size={14} className={isFavorite ? 'fill-amber-300' : ''} />
          </button>
        </div>
      )}
      <div ref={exportRef} className={`rounded-2xl border border-white/10 bg-[#0a0e1a] p-4 shadow-2xl ${compact ? 'space-y-3' : 'space-y-4'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="text-sm font-semibold text-white">Perspective Council</div>
            {message.scenarioTitle && <div className="mt-0.5 text-xs text-slate-500">{message.scenarioTitle}</div>}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-600">PNG Export</div>
        </div>

        {message.question && (
          <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-blue-300/70">问题</div>
            <div className="text-sm leading-relaxed text-blue-50">{message.question}</div>
          </div>
        )}

        {message.rounds?.map((round, ri) => (
          <div key={ri}>
            {/* Round header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
              <span className="text-xs font-medium text-blue-400 whitespace-nowrap">
                {round.title || `Round ${round.round}`}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
            </div>
            {/* Speakers */}
            <div className="space-y-2.5">
              {round.speakers?.map((speaker, si) => (
                <div key={si} className="glass rounded-xl p-4 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{persons[speaker.name]?.avatar || '🗣️'}</span>
                    <span className="font-medium text-xs text-white">{speaker.name}</span>
                    {speaker.seat && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                        {speaker.seat}
                      </span>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none text-slate-300 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{speaker.text || ''}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
