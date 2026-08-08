import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/downloads')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/downloads"!</div>
}
