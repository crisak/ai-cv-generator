'use client'

import { Sparkles, Key, Settings2 } from 'lucide-react'
import Link from 'next/link'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { chatWithCv } from '@/lib/ai-cv'
import type { ChatMessage, ChatStyle } from '@/lib/ai-cv'
import type { CvData } from '@/types/experience'
import type { SettingsDocument } from '@/lib/db/schemas'
import { useCallback, useState } from 'react'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'

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
  cvData: CvData
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
  cvData,
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
  const [localInput, setLocalInput] = useState(input)

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setLocalInput(value)
      onInputChange(value)
    },
    [onInputChange]
  )

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setLocalInput(suggestion)
      onInputChange(suggestion)
    },
    [onInputChange]
  )

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMsg: ChatMessage = { role: 'user', content: trimmed }
      const next = [...messages, userMsg]
      onMessagesChange(next)
      onInputChange('')
      setLocalInput('')
      onLoadingChange(true)

      const reply = await chatWithCv(next, cvData, draftCv, jobOfferText, settings, style)
      onMessagesChange([...next, { role: 'assistant', content: reply }])
      onLoadingChange(false)
    },
    [
      cvData,
      draftCv,
      jobOfferText,
      settings,
      style,
      isLoading,
      messages,
      onMessagesChange,
      onInputChange,
      onLoadingChange,
    ]
  )

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      send(message.text)
    },
    [send]
  )

  return (
    <div className="flex h-full flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              description="Tengo el contexto completo de tu borrador y la oferta. Pregúntame algo:"
              title="¿En qué puedo ayudarte?"
            >
              <div className="mt-4 flex max-w-full flex-wrap justify-center gap-2 px-2">
                {SUGGESTIONS.map((s) => (
                  <Suggestion key={s} onClick={handleSuggestionClick} suggestion={s} />
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            <>
              {messages.map((m, i) => (
                <Message from={m.role} key={i}>
                  <MessageContent>
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <>
                        <Sparkles className="text-primary mr-1.5 mb-0.5 inline h-3 w-3 shrink-0" />
                        <MessageResponse>{m.content}</MessageResponse>
                      </>
                    )}
                  </MessageContent>
                </Message>
              ))}
              {isLoading && (
                <Message from="assistant">
                  <MessageContent>
                    <span className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="bg-muted-foreground/60 h-1.5 w-1.5 animate-bounce rounded-full"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </span>
                  </MessageContent>
                </Message>
              )}
            </>
          )}
        </ConversationContent>
      </Conversation>

      <div className="border-border/40 shrink-0 space-y-2 border-t p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/70 mr-0.5 text-[10px] font-medium">Estilo:</span>
          {STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onStyleChange(s.value)}
              title={s.hint}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                style === s.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground bg-transparent'
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="text-muted-foreground/50 ml-auto text-[10px]">
            {STYLES.find((s) => s.value === style)?.hint}
          </span>
        </div>

        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            onChange={handleInputChange}
            placeholder="Pregunta algo… (Enter para enviar, Shift+Enter para salto)"
            value={localInput}
          />
          <PromptInputFooter>
            <PromptInputSubmit
              disabled={!localInput.trim() || isLoading}
              status={isLoading ? 'submitted' : undefined}
            />
          </PromptInputFooter>
        </PromptInput>

        {!settings?.aiApiKey && (
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
          >
            <Key className="h-3.5 w-3.5 shrink-0" />
            <span>Configura una API key en </span>
            <span className="font-medium underline underline-offset-2">Configuración</span>
            <Settings2 className="h-3 w-3 shrink-0" />
          </Link>
        )}
      </div>
    </div>
  )
}
