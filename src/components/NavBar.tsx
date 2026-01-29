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
      className="nav-container"
      onMouseLeave={() => setIsHoveringCharacters(false)}
    >
      {/* Main navigation bar */}
      <nav className="nav-bar">
        <ul className="nav-list">
          {visibleNavItems.map((item) => (
            <li key={item.path}>
              {item.label === "Characters" ? (
                <Link
                  to="/characters"
                  className={cn(
                    "nav-link",
                    isActive(item.path) && "nav-link-active",
                  )}
                  onMouseEnter={() => setIsHoveringCharacters(true)}
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  to={item.path}
                  className={cn(
                    "nav-link",
                    isActive(item.path) && "nav-link-active",
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
          className="nav-submenu"
          onMouseEnter={() => setIsHoveringCharacters(true)}
        >
          <div className="nav-submenu-content">
            {characters?.map((char) => (
              <Link
                key={char._id}
                to="/characters/$characterId"
                params={{ characterId: char._id }}
                className={cn(
                  "nav-submenu-link",
                  location.pathname === `/characters/${char._id}` &&
                    "nav-submenu-link-active",
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
