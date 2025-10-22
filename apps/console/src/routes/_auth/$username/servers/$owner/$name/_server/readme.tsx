import { createFileRoute } from '@tanstack/react-router'
import { processMarkdown } from '@/components/utils/markdown'

export const Route = createFileRoute(
  '/_auth/$username/servers/$owner/$name/_server/readme',
)({
  loader: async ({ params }) => {
    const res = await fetch(
      `/api/servers/${params.owner}/${params.name}/readme`,
    )
    if (!res.ok || res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to fetch README: ${res.status} ${res.statusText}`)
    }
    const markdown = await res.text()
    const html = await processMarkdown(markdown)
    return { html }
  },
  errorComponent: ({ error }) => {
    return (
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-muted-foreground py-24">
            <p className="text-base">
              {error.message || 'Something went wrong!'}
            </p>
          </div>
        </div>
      </div>
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { html } = Route.useLoaderData()
  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <article className="prose p-4 max-w-4xl">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </div>
    </div>
  )
}
