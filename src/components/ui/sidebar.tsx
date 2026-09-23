import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const sidebarVariants = cva(
  "fixed inset-y-0 z-50 flex w-64 flex-col border-r bg-background transition-all duration-300",
)

export const Sidebar = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <aside className={cn(sidebarVariants(), className)}>{children}</aside>
)

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full">{children}</div>
)

export const SidebarContent = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("flex h-full flex-col p-4", className)}>{children}</div>
)

export const SidebarGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
)

export const SidebarGroupContent = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-1">{children}</div>
)

export const SidebarGroupLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-2 py-2 text-xs font-semibold uppercase text-muted-foreground">{children}</div>
)

export const SidebarMenu = ({ children }: { children: React.ReactNode }) => (
  <ul className="space-y-1">{children}</ul>
)

export const SidebarMenuItem = ({ children }: { children: React.ReactNode }) => (
  <li>{children}</li>
)

export const SidebarMenuButton = ({ asChild, children, onClick, className }: { asChild?: boolean; children: React.ReactNode; onClick?: () => void; className?: string }) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      onClick={onClick}
      className={cn("flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground", className)}
    >
      {children}
    </Comp>
  )
}

export const SidebarHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("flex flex-col", className)}>{children}</div>
)
