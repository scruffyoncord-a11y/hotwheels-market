import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — LotClub",
};

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-8 scroll-mt-6">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        Privacy Policy
      </h1>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Last updated: September 11, 2026
      </p>

      <p className="mt-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        This Privacy Policy explains what information LotClub (&ldquo;we,&rdquo;
        &ldquo;us&rdquo;) collects when you use lotclub.in (the &ldquo;Platform&rdquo;), why we
        collect it, and the choices you have. It should be read alongside our{" "}
        <a href="/terms" className="text-orange-600 hover:underline dark:text-orange-400">
          Terms &amp; Conditions
        </a>
        .
      </p>

      <Section title="1. Information We Collect">
        <p>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            Account information.
          </span>{" "}
          If you sign in with Google, we receive your name, email address, and profile photo. If
          you sign in with a phone number, we collect that number and use it to send and verify a
          one-time WhatsApp code.
        </p>
        <p>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            Profile &amp; listing information.
          </span>{" "}
          Anything you choose to add — a username, city or pincode, avatar, listing or auction
          details, photos of items you list or add to your collection, trade proposals, bids, and
          messages you send through the Platform.
        </p>
        <p>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Usage data.</span> Basic
          technical information like pages viewed and listing view counts, used only to operate
          and improve the Platform.
        </p>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="list-disc space-y-1 pl-5">
          <li>To create and maintain your account and public profile;</li>
          <li>To operate listings, trades, auctions, and the reporting/moderation tools;</li>
          <li>To send you one-time codes (via WhatsApp) needed to sign in;</li>
          <li>To keep the Platform safe — detecting scalping, fraud, and abuse; and</li>
          <li>To communicate with you about your account or activity on the Platform.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </Section>

      <Section title="3. What Other Users Can See">
        <p>
          Your username, display name, avatar, city, listings, and (if you choose to make it
          public) your collection are visible to anyone who views your public profile. Your email
          address and phone number are never shown to other users.
        </p>
      </Section>

      <Section title="4. Third Parties We Share Data With">
        <p>
          We use a small number of service providers to run the Platform, and share only what
          each needs to do its job:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Google</span> — for
            Google Sign-In authentication.
          </li>
          <li>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Supabase</span> — our
            database, authentication, and file storage provider, which hosts all account, listing,
            and photo data.
          </li>
          <li>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Meta / WhatsApp Business Platform
            </span>{" "}
            — used to deliver one-time sign-in codes to your phone number when you choose phone
            sign-in.
          </li>
          <li>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">India Post</span> —
            we send a pincode you enter to India Post&apos;s public API to look up your city; no
            account-identifying information is sent.
          </li>
          <li>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Vercel</span> — hosts
            the Platform itself.
          </li>
        </ul>
        <p>
          We may also disclose information if required by law, or to investigate fraud, scalping,
          or abuse reported through the Platform.
        </p>
      </Section>

      <Section title="5. Cookies &amp; Local Storage">
        <p>
          We use your browser&apos;s local storage to remember things like your theme preference,
          whether you&apos;ve seen the welcome page before, and your wishlist/favorites — this
          stays on your device and isn&apos;t sent to us. We use cookies to keep you signed in
          securely across pages.
        </p>
      </Section>

      <Section title="6. Data Retention">
        <p>
          We keep your account information for as long as your account is active. If you delete
          your account (see below), we delete your personal information within a reasonable
          period, except where we&apos;re required to retain records for legal or fraud-prevention
          purposes.
        </p>
      </Section>

      <Section title="7. Your Rights">
        <p>
          You can review and update most of your information yourself from Settings — display
          name, avatar, city, pincode, and collection visibility. You can delete individual
          listings or inventory items at any time. For anything else, including deleting your
          account entirely, see the section below.
        </p>
      </Section>

      <Section title="Data Deletion" id="data-deletion">
        <p>
          To request deletion of your account and associated personal data, email{" "}
          <a
            href="mailto:lotclub.in@gmail.com?subject=Account%20deletion%20request"
            className="text-orange-600 hover:underline dark:text-orange-400"
          >
            lotclub.in@gmail.com
          </a>{" "}
          from the email address associated with your account (or, for phone sign-in, include the
          phone number on the account) with the subject &ldquo;Account deletion request.&rdquo; We
          will delete your profile, listings, inventory, and account data within 30 days,
          confirming once it&apos;s done.
        </p>
        <p>
          Deleting your account does not delete messages or trade history you&apos;re part of that
          another user&apos;s account still references (for example, a completed trade&apos;s
          record on the other party&apos;s side) — those are retained in de-identified form where
          possible.
        </p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>
          LotClub is not directed at children under 18. We do not knowingly collect information
          from anyone under 18.
        </p>
      </Section>

      <Section title="9. Security">
        <p>
          We use industry-standard measures — including access controls and encryption in
          transit — to protect your information, but no method of transmission or storage is
          completely secure, and we can&apos;t guarantee absolute security.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. If we make material changes,
          we&apos;ll post the updated policy here with a new &ldquo;Last updated&rdquo; date.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about this policy, or requests regarding your data, can be sent to{" "}
          <a
            href="mailto:lotclub.in@gmail.com"
            className="text-orange-600 hover:underline dark:text-orange-400"
          >
            lotclub.in@gmail.com
          </a>
          .
        </p>
      </Section>
    </main>
  );
}
