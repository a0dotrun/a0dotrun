import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function DeployYourOwn() {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-base">
        You can deploy your own custom MCP server to a0.
      </p>
      <div>
        <Button asChild variant="default">
          <Link className="font-mono" to="/">
            Just Deploy a Public Server
          </Link>
        </Button>
      </div>
      <div className="max-w-3xl">
        <h2 className="text-xl mb-4">What is a Server?</h2>
        <p className="text-base leading-relaxed">
          <Link to="/" className="underline">
            Everything on the Explore page
          </Link>{' '}
          is a MCP server someone has built and deployed to a0. For example,{' '}
          <Link to="/" className="underline">
            sanchitrk/remove-bg
          </Link>{' '}
          is a MCP server. It was pushed to a0 by{' '}
          <Link to="/" className="underline">
            sanchitrk
          </Link>
          .
        </p>
        <br />

        <p className="text-base leading-relaxed">
          <a
            href="https://modelcontextprotocol.io/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            The Model Context Protocol (MCP)
          </a>{' '}
          introduced by{' '}
          <a
            href="https://www.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Anthropic
          </a>
          , is a standardized, open-source protocol. It enables compatible AI
          models to interact dynamically and securely with compatible tools or
          data sources.
        </p>
      </div>
    </div>
  )
}
