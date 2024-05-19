import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "../ui/button"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { AvatarImage } from "@radix-ui/react-avatar"

export const Navbar = () => {
  const { data: session } = useSession()

  return (
    <div className="w-full h-16 border-b border-gray-300 flex flex-row px-8 items-center">
      <Link href="/ " className="text-2xl font-semibold">
        Bramster
      </Link>
      <div className="ml-auto">
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-full flex" asChild>
              <button type="button" className="rounded-full">
                <Avatar>
                  <AvatarImage
                    src={session.user.image ?? "https://github.com/shadcn.png"}
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-2 mt-4 p-3 flex flex-col gap-y-2">
              <div className="flex flex-col">
                <span className="font-semibold">{session.user.name}</span>
                {session.user.email}
              </div>

              <Button className="w-full" onClick={() => signOut()}>
                Sign out
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => signIn("auth0")}>Sign in</Button>
        )}
      </div>
    </div>
  )
}
