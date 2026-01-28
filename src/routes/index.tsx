import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/")({
  component: Home,
})

function Home() {
  const { isSignedIn, user } = useUser()

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center gap-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Legion Warband Buddy</h1>
        <p className="text-muted-foreground text-lg">
          Track and manage your warband heroes
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isSignedIn
              ? `Welcome, ${user?.firstName || "Hero"}!`
              : "Get Started"}
          </CardTitle>
          <CardDescription>
            {isSignedIn
              ? "Manage your warband and track your heroes."
              : "Sign in to start tracking your warband."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSignedIn ? (
            <div className="flex items-center justify-between">
              <Link to="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
              <UserButton />
            </div>
          ) : (
            <div className="flex gap-4">
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="outline">Sign Up</Button>
              </SignUpButton>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
