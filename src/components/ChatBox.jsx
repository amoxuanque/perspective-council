import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X, Star } from 'lucide-react'
import MessageBubble from './MessageBubble'
import { persons } from '../lib/prompts'
import { MODES } from '../lib/constants'

const FAVORITES_KEY = 'perspective-council:favorites'

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function ChatBox({ scenario }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [files, setFiles] = useState([])
  const [fileContents, setFileContents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState('standard')
  const [showFavorites, setShowFavorites] = useState(false)
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    } catch {
      return []
    }
  })
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = (message) => {
    if (!message?.id || !message?.question) return
    setFavorites(prev => {
      if (prev.some(item => item.id === message.id)) {
        return prev.filter(item => item.id !== message.id)
      }
      return [
        {
          id: message.id,
          role: 'assistant',
          question: message.question,
          rounds: message.rounds || [],
          error: message.error,
          scenarioTitle: scenario.title,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]
    })
  }

  const handleFileUpload = async (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
    
    for (const file of newFiles) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.content) {
          setFileContents(prev => [...prev, { name: file.name, content: data.content }])
        }
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setFileContents(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if (!input.trim() && fileContents.length === 0) return
    if (isLoading) return

    const questionText = input
    const exchangeId = createId()
    const userMsg = { id: `${exchangeId}-user`, role: 'user', content: questionText, files: files.map(f => f.name) }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const context = fileContents.map(f => `[${f.name}]:\n${f.content}`).join('\n\n')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenario.id,
          question: questionText,
          context,
          mode,
          history: messages.slice(-6)
        })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentRound = null
      let assistantMsg = { id: exchangeId, role: 'assistant', question: questionText, rounds: [] }
      setMessages(prev => [...prev, assistantMsg])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.round) {
                currentRound = { ...parsed, speakers: parsed.speakers || [] }
                assistantMsg = { ...assistantMsg, rounds: [...(assistantMsg.rounds || []), currentRound] }
              } else if (parsed.speaker) {
                if (currentRound) {
                  currentRound.speakers = [...(currentRound.speakers || []), parsed.speaker]
                  assistantMsg = { 
                    ...assistantMsg, 
                    rounds: assistantMsg.rounds.map((r, i) => 
                      i === assistantMsg.rounds.length - 1 ? currentRound : r
                    )
                  }
                }
              } else if (parsed.error) {
                const errorSpeaker = { name: '系统', seat: '错误', text: parsed.error }
                if (currentRound) {
                  currentRound.speakers = [...(currentRound.speakers || []), errorSpeaker]
                  assistantMsg = {
                    ...assistantMsg,
                    rounds: assistantMsg.rounds.map((r, i) =>
                      i === assistantMsg.rounds.length - 1 ? currentRound : r
                    )
                  }
                } else {
                  assistantMsg = { ...assistantMsg, error: parsed.error }
                }
              }
              setMessages(prev => [...prev.slice(0, -1), { ...assistantMsg }])
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: exchangeId, role: 'assistant', question: questionText, error: err.message }])
    }
    
    setIsLoading(false)
    setFiles([])
    setFileContents([])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4">
      {/* Scenario badge */}
      <div className="pt-4 pb-3 flex items-center gap-3 border-b border-white/5">
        <span className="text-lg">{scenario.icon}</span>
        <span className="text-sm font-medium text-white">{scenario.title}</span>
        <span className="text-xs text-slate-500">· {scenario.members.length}位委员</span>
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => setShowFavorites(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
              showFavorites
                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
            }`}
            title="查看收藏问答"
          >
            <Star size={13} className={favorites.length ? 'fill-amber-300 text-amber-300' : ''} />
            <span>收藏</span>
            {favorites.length > 0 && <span className="text-slate-500">{favorites.length}</span>}
          </button>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                mode === m.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
              }`}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {showFavorites && (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 space-y-3">
          {favorites.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs text-slate-500">还没有收藏问答</div>
          ) : (
            favorites.map(item => (
              <MessageBubble
                key={item.id}
                message={item}
                isFavorite
                onToggleFavorite={toggleFavorite}
                compact
              />
            ))
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-6">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm text-slate-500 mb-4">输入你的问题，委员会将开始讨论</p>
            <div className="flex flex-wrap justify-center gap-2">
              {scenario.members.map(name => (
                <span key={name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300">
                  <span>{persons[name]?.avatar}</span>
                  <span>{name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id || i}
            message={msg}
            isFavorite={favorites.some(item => item.id === msg.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-1.5 px-4 py-3">
            <span className="thinking-dot w-2 h-2 rounded-full bg-blue-400"></span>
            <span className="thinking-dot w-2 h-2 rounded-full bg-blue-400"></span>
            <span className="thinking-dot w-2 h-2 rounded-full bg-blue-400"></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File tags */}
      {files.length > 0 && (
        <div className="flex gap-2 px-1 pb-2 flex-wrap">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              📄 {f.name}
              <button onClick={() => removeFile(i)} className="ml-1 hover:text-red-400"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/5 pt-4 pb-6">
        <div className="flex items-end gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 focus-within:border-blue-500/50 focus-within:shadow-lg focus-within:shadow-blue-500/5 transition-all">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            title="上传文档"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.md,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }}}
            placeholder="输入你的问题..."
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500 max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && fileContents.length === 0)}
            className="p-2 rounded-lg bg-blue-600 text-white disabled:opacity-30 hover:bg-blue-500 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
