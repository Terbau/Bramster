"use client"
import { capitalized, cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface DashboardPageLink {
  label: string
  href: string
  predicate?: () => boolean
  children?: DashboardPageLink[] // can only go one level deep
}

const dashboardPageLinks: DashboardPageLink[] = [
  {
    label: "Courses",
    href: "/dashboard/courses",
    children: [
      {
        label: "Create",
        href: "/dashboard/courses/create",
      },
    ],
  },
  {
    label: "Questions",
    href: "/dashboard/questions",
    children: [
      {
        label: "Create",
        href: "/dashboard/questions/create",
      },
    ],
  },
] as const

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: session } = useSession()
  const currentHref = usePathname()

  if (!session) {
    return (
      <div className="flex justify-center">
        <p>Please sign in to access the dashboard</p>
      </div>
    )
  }

  if (!session.user.admin) {
    return (
      <div className="flex justify-center">
        <p>You do not have permission to access this page</p>
      </div>
    )
  }

  const currentLink = dashboardPageLinks.find(
    (link) => link.href === currentHref
  )
  const currentRootParent = currentHref.slice(0).split("/").at(0)
  let currentLinkLabel = currentLink?.label

  if (!currentLinkLabel) {
    currentLinkLabel = currentHref
      .slice(1)
      .split("/")
      .slice(1)
      .map((x) => capitalized(x))
      .join(" - ")
  }

  const createLink = (links: DashboardPageLink[], depth = 0) => {
    return links.map((link) => {
      if (link.children) {
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              style={{ marginLeft: `${depth * 1}rem` }}
              className={cn("hover:text-blue-500", {
                "font-medium": currentHref.startsWith(link.href),
              })}
            >
              {link.label}
            </Link>
            <ul>{createLink(link.children, depth + 1)}</ul>
          </li>
        )
      }
      return (
        <li key={link.href}>
          <Link
            href={link.href}
            style={{ marginLeft: `${depth * 1}rem` }}
            className={cn("hover:text-blue-500", {
              "font-medium": currentHref.startsWith(link.href),
            })}
          >
            {link.label}
          </Link>
        </li>
      )
    })
  }

  return (
    <div className="grid grid-cols-[14rem_minmax(900px,_1fr)] gap-x-4 w-full">
      <aside className="border border-gray-300 p-3 rounded-sm shrink-0">
        <nav>
          <h2 className="text-xl border-b pb-1 mb-2 font-medium">Dashboard</h2>
          <ul>{dashboardPageLinks.map((link) => createLink([link]))}</ul>
        </nav>
      </aside>
      <section className="p-6 border border-gray-300 rounded-sm grow">
        <h1 className="font-medium text-2xl">{currentLinkLabel}</h1>
        {children}
      </section>
    </div>
  )
}
