import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/softwares")({
  component: SoftwaresLayout,
});

function SoftwaresLayout() {
  return <Outlet />;
}
