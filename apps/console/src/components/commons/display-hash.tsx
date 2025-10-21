import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface HashDisplayProps {
  hash: string
  length?: number // Number of characters to display
  className?: string // Optional className for styling
}

export const HashDisplay: React.FC<HashDisplayProps> = ({
  hash,
  length = 8,
  className = '',
}: HashDisplayProps) => {
  // Remove 'sha256:' prefix if present
  const cleanHash = hash.startsWith('sha256:') ? hash.slice(7) : hash
  // Truncate to desired length and add ellipsis
  const truncatedHash =
    cleanHash.length > length ? `${cleanHash.slice(0, length)}...` : cleanHash

  return (
    <Badge title={hash} className={cn(className)}>
      {truncatedHash}
    </Badge>
  )
}
