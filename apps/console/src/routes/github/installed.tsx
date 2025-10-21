import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/github/installed')({
  component: RouteComponent,
})

function RouteComponent() {
  useEffect(() => {
    // Close the window after 2 seconds
    const timer = setTimeout(() => {
      window.close()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-4xl font-normal">GitHub Installation Completed</h1>
        <p className="text-lg">
          This window will close automatically. Otherwise, it can be safely
          closed.
        </p>
      </div>
    </div>
  )
}
