import { UserButton, useUser } from "@clerk/clerk-react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/_protected/dashboard")({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useUser()
  const heroes = useQuery(api.heroes.list)

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || "Hero"}!
          </p>
        </div>
        <UserButton />
      </header>

      <main className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Warband</CardTitle>
            <CardDescription>
              {heroes === undefined
                ? "Loading heroes..."
                : heroes.length === 0
                  ? "You haven't added any heroes yet."
                  : `You have ${heroes.length} hero${heroes.length === 1 ? "" : "es"} in your warband.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {heroes && heroes.length > 0 ? (
              <ul className="space-y-2">
                {heroes.map((hero) => (
                  <li
                    key={hero._id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{hero.name}</span>
                      <span className="text-muted-foreground ml-2">
                        Level {hero.level} {hero.class}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      HP: {hero.stats.health} | ATK: {hero.stats.attack} | DEF:{" "}
                      {hero.stats.defense}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Start by adding your first hero to the warband.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guild</CardTitle>
            <CardDescription>
              Join a guild to play with others and view their characters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/guild">
              <Button>Go to Guild</Button>
            </Link>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
