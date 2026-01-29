import { Link, useLocation } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { api } from "../../convex/_generated/api"

const NAV_ITEMS = [
  { label: "Home", path: "/dashboard" },
  { label: "Characters", path: "/characters" },
  { label: "Data", path: "/data", adminOnly: true },
  { label: "Guild", path: "/guild" },
] as const

// Submenu items for Data admin menu
const DATA_SUBMENU_ITEMS = [
  { label: "Sets", path: "/sets" },
  { label: "Locations", path: "/locations" },
] as const

export function NavBar() {
  const location = useLocation()
  const user = useQuery(api.users.getMe)
  const characters = useQuery(api.characters.list)
  const [isHoveringCharacters, setIsHoveringCharacters] = useState(false)
  const [isHoveringData, setIsHoveringData] = useState(false)

  const isAdmin = user?.isAdmin ?? false
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !("adminOnly" in item && item.adminOnly) || isAdmin,
  )

  const isActive = (path: string) => {
    if (path === "/characters") {
      return location.pathname.startsWith("/characters")
    }
    if (path === "/data") {
      // Data is active if we're in /sets or /locations
      return (
        location.pathname.startsWith("/sets") ||
        location.pathname.startsWith("/locations")
      )
    }
    if (path === "/guild") {
      return location.pathname.startsWith("/guild")
    }
    return location.pathname === path
  }

  const isCharactersSection = location.pathname.startsWith("/characters")
  const isDataSection =
    location.pathname.startsWith("/sets") ||
    location.pathname.startsWith("/locations")

  // Only one submenu can be shown at a time
  // Priority: hovering state > current section
  const isHoveringAny = isHoveringCharacters || isHoveringData
  const showCharactersSubmenu = isHoveringAny
    ? isHoveringCharacters
    : isCharactersSection
  const showDataSubmenu = isHoveringAny ? isHoveringData : isDataSection

  return (
    <div
      className="w-1/3 min-w-[300px] max-w-[500px] mt-20 mb-8"
      onMouseLeave={() => {
        setIsHoveringCharacters(false)
        setIsHoveringData(false)
      }}
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
                  onMouseEnter={() => {
                    setIsHoveringCharacters(true)
                    setIsHoveringData(false)
                  }}
                >
                  {item.label}
                </Link>
              ) : item.label === "Data" ? (
                <Link
                  to="/sets"
                  className={cn(
                    "inline-flex items-center justify-center flex-1 px-6 py-4 text-base font-medium text-[oklch(0.75_0_0)] no-underline bg-transparent border-none cursor-pointer transition-all duration-200 hover:text-[oklch(0.95_0_0)] hover:bg-[oklch(0.3_0_0)]",
                    isActive(item.path) &&
                      "text-[oklch(0.95_0_0)] bg-[oklch(0.35_0_0)] shadow-[inset_0_-3px_0_var(--quality-epic)]",
                  )}
                  onMouseEnter={() => {
                    setIsHoveringData(true)
                    setIsHoveringCharacters(false)
                  }}
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
                  onMouseEnter={() => {
                    setIsHoveringCharacters(false)
                    setIsHoveringData(false)
                  }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Characters sub-menu */}
      {showCharactersSubmenu && (
        <div
          className="relative ml-10 pl-14 pr-16 w-fit"
          onMouseEnter={() => {
            setIsHoveringCharacters(true)
            setIsHoveringData(false)
          }}
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

      {/* Data sub-menu */}
      {showDataSubmenu && (
        <div
          className="relative ml-10 pl-14 pr-16 w-fit"
          onMouseEnter={() => {
            setIsHoveringData(true)
            setIsHoveringCharacters(false)
          }}
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
            {DATA_SUBMENU_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "inline-flex items-center px-8 py-3 text-sm font-medium text-[oklch(0.7_0_0)] no-underline transition-all duration-200 whitespace-nowrap hover:text-[oklch(0.95_0_0)] hover:bg-[oklch(0.3_0_0)]",
                  location.pathname.startsWith(item.path) &&
                    "text-[var(--quality-epic)] bg-[oklch(0.28_0_0)] shadow-[inset_0_-3px_0_var(--quality-epic)] font-semibold",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
