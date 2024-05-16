import { Fragment, type FC } from "react"
import {
  Breadcrumb as OriginalBreadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export interface BreadcrumbLinkEntry {
  label: string
  href: string
}

interface BreadcrumbProps {
  links: BreadcrumbLinkEntry[]
  maxSeparators?: number
}

export const Breadcrumb: FC<BreadcrumbProps> = ({
  links,
  maxSeparators = 3,
}) => {
  const dropdownLinks = []
  const breadcrumbLinks = []
  let homeBreadcrumb: BreadcrumbLinkEntry = { label: "Home", href: "/" }
  const currentBreadcrumb: BreadcrumbLinkEntry | undefined = links.at(-1)

  if (links.at(0)?.href === "/") {
    const shifted = links.shift()
    if (shifted) {
      homeBreadcrumb = shifted
    }
  }

  for (let i = 0; i < links.length - 1; i++) {
    if (i >= links.length - maxSeparators + 1) {
      breadcrumbLinks.push(links[i])
    } else {
      dropdownLinks.push(links[i])
    }
  }

  return (
    <OriginalBreadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={homeBreadcrumb.href}>
            {homeBreadcrumb.label}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {dropdownLinks.length > 0 && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {dropdownLinks.map((link, index) => (
                    <DropdownMenuItem
                      key={`${link.href}-${link.label}-${index}`}
                      asChild
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          </>
        )}
        {breadcrumbLinks.map((link, index) => (
          <Fragment key={`${link.href}-${link.label}-${index}`}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={link.href}>{link.label}</BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}
        <BreadcrumbSeparator />
        {currentBreadcrumb && (
          <BreadcrumbItem>
            <BreadcrumbPage>{currentBreadcrumb.label}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </OriginalBreadcrumb>
  )
}
