"use client"

import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  Plus,
} from "lucide-react"

interface DashboardPageLink {
  label: string
  href: string
  icon?: React.ReactNode
  children?: DashboardPageLink[]
}

const dashboardPageLinks: DashboardPageLink[] = [
  {
    label: "Courses",
    href: "/dashboard/courses",
    icon: <BookOpen className="h-4 w-4" />,
    children: [
      {
        label: "Create",
        href: "/dashboard/courses/create",
        icon: <Plus className="h-3.5 w-3.5" />,
      },
    ],
  },
  {
    label: "Questions",
    href: "/dashboard/questions",
    icon: <HelpCircle className="h-4 w-4" />,
    children: [
      {
        label: "Create",
        href: "/dashboard/questions/create",
        icon: <Plus className="h-3.5 w-3.5" />,
      },
    ],
  },
] as const

function SidebarLink({
  link,
  currentHref,
  depth = 0,
}: {
  link: DashboardPageLink
  currentHref: string
  depth?: number
}) {
  const isActive = currentHref.startsWith(link.href)
  const isExactActive = currentHref === link.href

  return (
    <li>
      <Link
        href={link.href}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
          depth === 0
            ? "font-medium"
            : "ml-3 text-xs font-normal text-muted-foreground",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-sidebar-foreground hover:bg-accent/50 hover:text-accent-foreground"
        )}
      >
        {link.icon && (
          <span className={cn("shrink-0", isActive ? "opacity-100" : "opacity-60")}>
            {link.icon}
          </span>
        )}
        <span className="flex-1">{link.label}</span>
        {link.children && depth === 0 && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-40 transition-transform",
              currentHref.startsWith(link.href) && "rotate-90"
            )}
          />
        )}
      </Link>

      {link.children && currentHref.startsWith(link.href) && (
        <ul className="mt-0.5 mb-1 space-y-0.5">
          {link.children.map((child) => (
            <SidebarLink
              key={child.href}
              link={child}
              currentHref={currentHref}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function getPageLabel(currentHref: string): string {
  const match = dashboardPageLinks.find((link) => link.href === currentHref)
  if (match) return match.label

  for (const link of dashboardPageLinks) {
    const child = link.children?.find((c) => c.href === currentHref)
    if (child) return `${link.label} — ${child.label}`
  }

  return currentHref
    .slice(1)
    .split("/")
    .slice(1)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" — ")
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: session } = useSession()
  const currentHref = usePathname()

  if (!session) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-muted-foreground">Please sign in to access the dashboard</p>
      </div>
    )
  }

  if (!session.user.admin) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-muted-foreground">You do not have permission to access this page</p>
      </div>
    )
  }

  return (
    <div className="flex gap-6 w-full items-start">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 sticky top-6">
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Sidebar header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b bg-muted/40">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold tracking-tight">Dashboard</span>
          </div>

          {/* Nav links */}
          <nav className="p-2">
            <ul className="space-y-0.5">
              {dashboardPageLinks.map((link) => (
                <SidebarLink
                  key={link.href}
                  link={link}
                  currentHref={currentHref}
                />
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 min-w-0 rounded-xl border bg-card p-6">
        <h1 className="font-semibold text-2xl mb-6">{getPageLabel(currentHref)}</h1>
        {children}
      </section>
    </div>
  )
}
