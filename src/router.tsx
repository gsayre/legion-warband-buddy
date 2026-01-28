import { ClerkProvider, useAuth } from "@clerk/clerk-react"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { routerWithQueryClient } from "@tanstack/react-router-with-query"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { routeTree } from "./routeTree.gen"

// Get env vars - works in both SSR (process.env) and client (import.meta.env)
function getEnvVar(name: string): string {
  // Try import.meta.env first (client-side, build-time inlined)
  const viteValue = import.meta.env[name]
  if (viteValue) return viteValue

  // Fall back to process.env (SSR runtime)
  if (typeof process !== "undefined") {
    // Try with VITE_ prefix first, then without
    if (process.env[name]) return process.env[name] as string
    const withoutPrefix = name.replace(/^VITE_/, "")
    if (process.env[withoutPrefix]) return process.env[withoutPrefix] as string
  }

  return ""
}

export function getRouter() {
  const CONVEX_URL = getEnvVar("VITE_CONVEX_URL")
  const CLERK_PUBLISHABLE_KEY = getEnvVar("VITE_CLERK_PUBLISHABLE_KEY")

  if (!CONVEX_URL) {
    console.error("missing envar VITE_CONVEX_URL")
  }
  if (!CLERK_PUBLISHABLE_KEY) {
    console.error("missing envar VITE_CLERK_PUBLISHABLE_KEY")
  }

  const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: "intent",
      context: { queryClient },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
      defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
      defaultNotFoundComponent: () => <p>not found</p>,
      Wrap: ({ children }) => (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
          <ConvexProviderWithClerk
            client={convexQueryClient.convexClient}
            useAuth={useAuth}
          >
            {children}
          </ConvexProviderWithClerk>
        </ClerkProvider>
      ),
    }),
    queryClient,
  )

  return router
}
