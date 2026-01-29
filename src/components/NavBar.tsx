import { Link, useLocation } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { api } from "../../convex/_generated/api"

const NAV_ITEMS = [
  { label: "Home", path: "/dashboard" },
  { label: "Characters", path: "/characters" },
  { label: "Sets", path: "/sets", adminOnly: true },
  { label: "Guild", path: "/guild" },
] as const

export function NavBar() {
  const location = useLocation()
  const user = useQuery(api.users.getMe)
  const characters = useQuery(api.characters.list)
  const [isHoveringCharacters, setIsHoveringCharacters] = useState(false)

  const isAdmin = user?.isAdmin ?? false
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !("adminOnly" in item && item.adminOnly) || isAdmin,
  )

  const isActive = (path: string) => {
    if (path === "/characters") {
      return location.pathname.startsWith("/characters")
    }
    if (path === "/sets") {
      return location.pathname.startsWith("/sets")
    }
    if (path === "/guild") {
      return location.pathname.startsWith("/guild")
    }
    return location.pathname === path
  }

  const isCharactersSection = location.pathname.startsWith("/characters")
  const showSubmenu = isCharactersSection || isHoveringCharacters

  return (
    <div
      className="w-1/3 min-w-[300px] max-w-[500px] mt-20 mb-8"
      onMouseLeave={() => setIsHoveringCharacters(false)}
    >
      {/* Main navigation bar */}
      <nav
        className="relative flex items-stretch bg-[oklch(0.22_0_0)] pr-12"
        style={{
          clipPath: "polygon(0 0, calc(100% - 2.5rem) 0, 100% 100%, 0 100%)",
        }}
      >
        <ul className="flex flex-1 list-none m-0 p-0 items-stretch">
          {visibleNavItems.map((item) => (
            <li key={item.path} className="flex flex-1 items-stretch">
              {item.label === "Characters" ? (
                <Link
                  to="/characters"
                  className={cn(
                    "inline-flex items-center justify-center flex-1 px-6 py-4 text-base font-medium text-[oklch(0.75_0_0)] no-underline bg-transparent border-none cursor-pointer transition-all duration-200 hover:text-[oklch(0.95_0_0)] hover:bg-[oklch(0.3_0_0)]",
                    isActive(item.path) &&
                      "text-[oklch(0.95_0_0)] bg-[oklch(0.35_0_0)] shadow-[inset_0_-3px_0_var(--quality-epic)]",
                  )}
                  onMouseEnter={() => setIsHoveringCharacters(true)}
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  to={item.path}
                  className={cn(
                    "inline-flex items-center justify-center flex-1 px-6 py-4 text-base font-medium text-[oklch(0.75_0_0)] no-underline bg-transparent border-none cursor-pointer transition-all duration-200 hover:text-[oklch(0.95_0_0)] hover:bg-[oklch(0.3_0_0)]",
                    isActive(item.path) &&
                      "text-[oklch(0.95_0_0)] bg-[oklch(0.35_0_0)] shadow-[inset_0_-3px_0_var(--quality-epic)]",
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Characters sub-menu */}
      {showSubmenu && (
        <div
          className="relative ml-10 pl-14 pr-16 w-fit"
          onMouseEnter={() => setIsHoveringCharacters(true)}
        >
          {/* Parallelogram background */}
          <div
            className="absolute inset-0 bg-[oklch(0.22_0_0)] -z-10"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 2.5rem) 0, 100% 100%, 2.5rem 100%)",
            }}
          />
          <div className="flex items-stretch">
            {characters?.map((char) => (
              <Link
                key={char._id}
                to="/characters/$characterId"
                params={{ characterId: char._id }}
                className={cn(
                  "inline-flex items-center px-3.5 py-3 text-sm font-medium text-[oklch(0.7_0_0)] no-underline transition-all duration-200 whitespace-nowrap hover:text-[oklch(0.95_0_0)] hover:bg-[oklch(0.3_0_0)]",
                  location.pathname === `/characters/${char._id}` &&
                    "text-[var(--quality-epic)] bg-[oklch(0.28_0_0)] shadow-[inset_0_-3px_0_var(--quality-epic)] font-semibold",
                )}
              >
                {char.className}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
