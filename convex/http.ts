import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { Webhook } from "svix"

const http = httpRouter()

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET")
      return new Response("Server misconfigured", { status: 500 })
    }

    const svixId = request.headers.get("svix-id")
    const svixTimestamp = request.headers.get("svix-timestamp")
    const svixSignature = request.headers.get("svix-signature")

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 })
    }

    const body = await request.text()

    const wh = new Webhook(webhookSecret)
    let evt: WebhookEvent

    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent
    } catch (err) {
      console.error("Webhook verification failed:", err)
      return new Response("Invalid signature", { status: 400 })
    }

    const eventType = evt.type

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, first_name, last_name, email_addresses, image_url } = evt.data
      const name =
        [first_name, last_name].filter(Boolean).join(" ") || "Anonymous"
      const email = email_addresses?.[0]?.email_address

      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkId: id,
        name,
        email,
        imageUrl: image_url,
      })
    } else if (eventType === "user.deleted") {
      const { id } = evt.data
      if (id) {
        await ctx.runMutation(internal.users.deleteFromClerk, {
          clerkId: id,
        })
      }
    }

    return new Response("OK", { status: 200 })
  }),
})

type WebhookEvent = {
  type: "user.created" | "user.updated" | "user.deleted"
  data: {
    id: string
    first_name?: string | null
    last_name?: string | null
    email_addresses?: Array<{ email_address: string }>
    image_url?: string
  }
}

export default http
