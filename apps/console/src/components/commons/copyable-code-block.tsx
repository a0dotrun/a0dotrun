"use client"

import { useCopyToClipboard } from '@uidotdev/usehooks'
import { CheckCheck, Copy } from 'lucide-react'
import * as React from 'react'
import { codeToHtml } from 'shiki'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CopyableCodeBlockProps = {
  code: string
  title?: string
  language?: string
  className?: string
}

export function CopyableCodeBlock({
  code,
  title,
  language,
  className,
}: CopyableCodeBlockProps) {
  const [copiedText, copyToClipboard] = useCopyToClipboard()
  const [highlightedCode, setHighlightedCode] = React.useState<string>('')
  const hasCopied = copiedText === code
  const label =
    title ??
    language?.toUpperCase() ??
    (code.trim().includes('\n') ? 'CODE' : 'COMMAND')

  React.useEffect(() => {
    if (language && language !== 'bash' && language !== 'sh') {
      codeToHtml(code, {
        lang: language,
        theme: 'github-dark',
      }).then((html) => {
        setHighlightedCode(html)
      })
    }
  }, [code, language])

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs hover:bg-muted/40"
          onClick={() => copyToClipboard(code)}
          disabled={hasCopied}
        >
          {hasCopied ? (
            <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="font-medium">{hasCopied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
      {highlightedCode ? (
        <div
          className="w-full max-h-[28rem] overflow-y-auto overflow-x-auto [&_pre]:m-0 [&_pre]:max-w-full [&_pre]:bg-transparent [&_pre]:px-4 [&_pre]:py-5 [&_pre]:text-sm [&_pre]:leading-relaxed [&_code]:block [&_code]:w-full [&_code]:max-w-full [&_code]:break-all [&_code]:whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      ) : (
        <pre className="w-full max-w-full max-h-[28rem] overflow-y-auto overflow-x-auto bg-transparent px-4 py-5 text-sm leading-relaxed">
          <code className="block w-full max-w-full break-all whitespace-pre-wrap font-mono text-xs sm:text-sm">
            {code}
          </code>
        </pre>
      )}
    </div>
  )
}
