import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/software-categories')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/software-categories"!</div>
}
