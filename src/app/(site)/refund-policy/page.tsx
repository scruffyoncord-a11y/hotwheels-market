import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — LotClub",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        Refund Policy
      </h1>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Last updated: September 12, 2026
      </p>

      <p className="mt-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        This policy covers the two paid services LotClub offers directly: listing boosts and the
        auction closing fee. Both are processed through Razorpay. It does not cover trades or
        auction sale amounts themselves — those are private arrangements between collectors, and
        LotClub is never a party to that payment (see our{" "}
        <a href="/terms" className="text-orange-600 hover:underline dark:text-orange-400">
          Terms &amp; Conditions
        </a>
        ).
      </p>

      <Section title="1. Listing Boosts">
        <p>
          A boost pins your listing to the top of the browse and auction boards for a fixed
          duration, starting immediately once payment succeeds. Because the service is delivered
          in full at the moment of payment, boost payments are{" "}
          <strong>final and non-refundable</strong>, including if the listing is later sold,
          removed, or marked reserved before the boost window ends.
        </p>
      </Section>

      <Section title="2. Auction Closing Fee">
        <p>
          The auction closing fee is charged to the seller to close a completed auction and mark
          it sold. Once paid, this fee is <strong>final and non-refundable</strong> — this is true
          even if the winning bidder later fails to complete the trade, since the fee is for
          closing the auction itself, not for guaranteeing the outcome of the trade that follows.
        </p>
      </Section>

      <Section title="3. Failed or Duplicate Payments">
        <p>
          If a payment is deducted from your account but LotClub never registers it as successful
          (for example, a network error after payment but before confirmation), contact us with
          your payment reference and we will investigate and refund any amount charged for which
          the corresponding service was not delivered. The same applies to any accidental
          duplicate charge for the same boost or auction closing fee.
        </p>
      </Section>

      <Section title="4. How Refunds Are Issued">
        <p>
          Approved refunds are issued back to the original payment method via Razorpay, and
          typically reflect within 5–7 business days depending on your bank or payment provider.
          LotClub does not issue refunds in cash or to a different account or instrument.
        </p>
      </Section>

      <Section title="5. Requesting a Refund">
        <p>
          Email{" "}
          <a
            href="mailto:lotclub.in@gmail.com"
            className="text-orange-600 hover:underline dark:text-orange-400"
          >
            lotclub.in@gmail.com
          </a>{" "}
          with the affected listing, the approximate time of payment, and your Razorpay payment
          ID if you have it. We aim to respond within 3 business days.
        </p>
      </Section>

      <Section title="6. Changes to This Policy">
        <p>
          We may update this policy from time to time. If we make material changes, we will post
          the updated policy on this page with a new &ldquo;Last updated&rdquo; date.
        </p>
      </Section>

      <p className="mt-10 text-xs text-zinc-400 dark:text-zinc-600">
        © {new Date().getFullYear()} LotClub. All rights reserved.
      </p>
    </main>
  );
}
