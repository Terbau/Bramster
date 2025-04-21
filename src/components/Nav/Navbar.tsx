import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "../ui/button"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { AvatarImage } from "@radix-ui/react-avatar"
import { AreaChart, LogOut } from "lucide-react"

interface NavLink {
  label: string
  href: string
  predicate?: () => boolean
}

export const Navbar = () => {
  const { data: session } = useSession()

  const navLinks = [
    // { label: "About", href: "/about" },
    {
      label: "Dashboard",
      href: "/dashboard",
      predicate: () => session?.user?.admin ?? false,
    },
  ]

  return (
    <div className="w-full h-16 border-b border-gray-300 flex flex-row px-8 items-center">
      <Link href="/ " className="text-2xl font-semibold">
        Bramster
      </Link>
      <div className="ml-auto flex flex-row items-center gap-x-8">
        {navLinks
          .filter((link) => (link.predicate ? link.predicate() : true))
          .map((link) => (
            <Link key={link.href} href="/dashboard">
              {link.label}
            </Link>
          ))}
        {session ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger className="h-full flex" asChild>
                <button type="button" className="rounded-full">
                  <Avatar>
                    <AvatarImage
                      src={
                        session.user.image ?? "https://github.com/shadcn.png"
                      }
                      alt="@shadcn"
                    />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mr-2 mt-4">
                <div className="flex flex-col">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <span className="-mt-1 px-2 text-sm">
                    {session.user.email}
                  </span>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/my-results" className="">
                      <AreaChart className="mr-2 h-4 w-4" />
                      <span>My results</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button onClick={() => signIn("auth0")}>Sign in</Button>
        )}
      </div>
    </div>
  )
}
