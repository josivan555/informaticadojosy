import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/softwares')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/softwares"!</div>
}
