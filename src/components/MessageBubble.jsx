import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { persons } from '../lib/prompts'

export default function MessageBubble({ message }) {
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

  if (message.error) {
    return (
      <div className="animate-fade-in px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
        ⚠️ {message.error}
      </div>
    )
  }

  // Assistant message with rounds
  return (
    <div className="animate-fade-in space-y-4">
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
  )
}
