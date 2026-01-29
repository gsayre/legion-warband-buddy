import { SignIn, useAuth } from "@clerk/clerk-react"
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { NavBar } from "@/components/NavBar"

export const Route = createFileRoute("/_protected")({
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: "/" })
    }
  }, [isLoaded, isSignedIn, navigate])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SignIn routing="hash" />
      </div>
    )
  }

  return (
    <div className="main-with-nav">
      <NavBar />
      <Outlet />
    </div>
  )
}
