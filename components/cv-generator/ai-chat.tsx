'use client'

import { useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { chatWithCv } from '@/lib/ai-cv'
import type { ChatMessage, ChatStyle } from '@/lib/ai-cv'
import type { CvData } from '@/types/experience'
import type { SettingsDocument } from '@/lib/db/schemas'

const SUGGESTIONS = [
  '¿Qué keywords críticas me faltan cubrir?',
  '¿Cómo puedo reducir el CV a 1 página?',
  '¿Qué bullets debo priorizar para esta oferta?',
  'Dame 3 sugerencias concretas para mejorar mi CV',
]

const STYLES: { value: ChatStyle; label: string; hint: string }[] = [
  { value: 'concise', label: 'Conciso', hint: '2-3 oraciones' },
  { value: 'normal', label: 'Normal', hint: 'Balanceado' },
  { value: 'extended', label: 'Extendido', hint: 'Con detalle' },
]

interface AiChatProps {
  draftCv: CvData
  jobOfferText: string
  settings: SettingsDocument | null
  messages: ChatMessage[]
  onMessagesChange: (msgs: ChatMessage[]) => void
  input: string
  onInputChange: (v: string) => void
  isLoading: boolean
  onLoadingChange: (v: boolean) => void
  style: ChatStyle
  onStyleChange: (s: ChatStyle) => void
}

export function AiChat({
  draftCv,
  jobOfferText,
  settings,
  messages,
  onMessagesChange,
  input,
  onInputChange,
  isLoading,
  onLoadingChange,
  style,
  onStyleChange,
}: AiChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    onMessagesChange(next)
    onInputChange('')
    onLoadingChange(true)

    const reply = await chatWithCv(next, draftCv, jobOfferText, settings, style)
    onMessagesChange([...next, { role: 'assistant', content: reply }])
    onLoadingChange(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground mb-3">
              Tengo el contexto completo de tu borrador y la oferta. Pregúntame algo:
            </p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="block w-full text-left rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn('flex flex-col gap-1', m.role === 'user' ? 'items-end' : 'items-start')}
            >
              <div
                className={cn(
                  'rounded-xl px-3 py-2.5 text-xs leading-relaxed break-words',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground max-w-[85%]'
                    : 'bg-muted/50 text-foreground border border-border/40 max-w-[92%] w-full'
                )}
              >
                {m.role === 'user' ? (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                ) : (
                  <div className="prose prose-xs dark:prose-invert max-w-none
                    [&>p]:mb-2 [&>p:last-child]:mb-0
                    [&>ul]:mb-2 [&>ul]:pl-4 [&>ul>li]:mb-0.5 [&>ul>li]:list-disc
                    [&>ol]:mb-2 [&>ol]:pl-4 [&>ol>li]:mb-0.5 [&>ol>li]:list-decimal
                    [&>h1]:text-xs [&>h2]:text-xs [&>h3]:text-xs
                    [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-semibold
                    [&>h1]:mb-1.5 [&>h2]:mb-1.5 [&>h3]:mb-1
                    [&>strong]:font-semibold
                    [&>code]:bg-muted [&>code]:px-1 [&>code]:rounded [&>code]:text-[11px]
                    [&>pre]:bg-muted [&>pre]:p-2 [&>pre]:rounded [&>pre]:overflow-x-auto [&>pre]:text-[11px]
                    [&>blockquote]:border-l-2 [&>blockquote]:border-primary/40 [&>blockquote]:pl-2 [&>blockquote]:text-muted-foreground
                  ">
                    <Sparkles className="h-3 w-3 text-primary inline mr-1.5 mb-0.5 shrink-0" />
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-muted/50 border border-border/40 rounded-xl px-3 py-2.5">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Style selector + Input */}
      <div className="border-t border-border/40 p-3 space-y-2 shrink-0">
        {/* Style selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/70 font-medium mr-0.5">Estilo:</span>
          {STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onStyleChange(s.value)}
              title={s.hint}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors border',
                style === s.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground/50">
            {STYLES.find((s) => s.value === style)?.hint}
          </span>
        </div>

        {/* Textarea */}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta algo… (Enter para enviar, Shift+Enter para salto)"
            disabled={isLoading}
            rows={2}
            className="flex-1 rounded-lg border border-input bg-muted/20 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 disabled:opacity-50 leading-relaxed"
          />
          <button
            type="button"
            disabled={!input.trim() || isLoading}
            onClick={() => send(input)}
            className="rounded-lg bg-primary p-2.5 text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        {!settings?.aiApiKey && (
          <p className="text-[10px] text-muted-foreground/60">
            Configura una API key en Configuración para activar el chat.
          </p>
        )}
      </div>
    </div>
  )
}
