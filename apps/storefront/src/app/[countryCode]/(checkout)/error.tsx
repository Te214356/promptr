"use client"

import { useEffect } from "react"

/**
 * Checkout had no error boundary of its own, so any failure here bubbled to
 * `app/error.tsx` — a full-page replacement that renders its own <html>, drops
 * the buyer out of the checkout chrome, and shows nothing identifying. A
 * transient failure between the address and payment steps left no trace: the
 * root boundary only console.errors, and never surfaced `digest`.
 *
 * This keeps the failure inside the checkout layout and puts the digest on
 * screen. `digest` is the hash Next assigns to a server-side error; it is the
 * only handle that ties what the buyer saw to the server logs, since the real
 * message is stripped in production. Ask for it in a support message.
 */
export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Keep the full error in the browser console for anyone with devtools open.
    console.error("[checkout] boundary caught:", error)
  }, [error])

  return (
    <div className="content-container py-16 flex justify-center">
      <div className="max-w-lg w-full rounded-xl border border-white/[0.08] bg-[#0d0d1f] p-6 text-center">
        <h1 className="text-white text-xl font-semibold mb-2">
          تعذّر إكمال هذه الخطوة / This step could not be completed
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-2">
          لم يتم خصم أي مبلغ. حاول مرة أخرى — وإن تكرر الخطأ، أرسل لنا الرمز
          أدناه.
        </p>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          No payment was taken. Try again — if it keeps happening, send us the
          code below.
        </p>

        {/*
          Only shown when Next produced a digest (server-side errors). A purely
          client-side error has none, and an empty "code:" box would just look
          broken.
        */}
        {error.digest && (
          <div className="mb-6 rounded-lg border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-white/30 text-xs mb-1">
              رمز الخطأ / Error code
            </p>
            <code
              className="text-[#00CFFF] text-sm font-mono select-all break-all"
              data-testid="checkout-error-digest"
            >
              {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-col small:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-full bg-[#6C2BFF] text-white text-sm font-medium hover:opacity-90 transition"
          >
            إعادة المحاولة / Retry
          </button>
          {/*
            A bare path, not LocalizedClientLink and not a hardcoded region: the
            middleware redirects /contact to the visitor's region, and this
            boundary can render after a failure in the very params resolution
            that useParams() would read.
          */}
          <a
            href="/contact"
            className="px-5 py-2.5 rounded-full border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/20 transition"
          >
            تواصل معنا / Contact us
          </a>
        </div>
      </div>
    </div>
  )
}
