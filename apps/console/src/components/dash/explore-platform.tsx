import { ExternalLink, LayoutGrid, BookOpen, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

export function ExplorePlatform({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-zinc-50 p-6 border-border border rounded-xl',
        className,
      )}
    >
      <div className="mb-6">
        <h2 className="text-xl mb-4">Explore the Platform</h2>
        <hr />
      </div>

      <div className="space-y-8">
        {/* Browse Toolkits */}
        <Link
          to="/"
          className="flex items-start space-x-4 group cursor-pointer hover:bg-accent p-2 rounded-xl"
        >
          <LayoutGrid className="text-muted-foreground flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold">Browse MCP Servers</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Explore hundreds of MCP servers created by the community.
            </p>
          </div>
          <ExternalLink className="flex-shrink-0 mt-1 size-4 text-muted-foreground" />
        </Link>
        {/* Documentation */}
        <a
          href="https://docs.riverly.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start space-x-4 group cursor-pointer hover:bg-accent p-2 rounded-xl"
        >
          <BookOpen className="flex-shrink-0 mt-1 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold">Documentation</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Get started fast with guides, setup instructions, and best
              practices across the platform.
            </p>
          </div>
          <ExternalLink className="flex-shrink-0 mt-1 size-4 text-muted-foreground" />
        </a>
        {/*  Community */}
        <a
          href="https://github.com/orgs/a0dotrun/discussions"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start space-x-4 group cursor-pointer hover:bg-accent p-2 rounded-xl"
        >
          <Users className="flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold">Community</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Join our community to get help, share your ideas, and stay up to
              date with the latest news.
            </p>
          </div>
          <ExternalLink className="flex-shrink-0 mt-1 size-4 text-muted-foreground" />
        </a>
      </div>
    </div>
  )
}
