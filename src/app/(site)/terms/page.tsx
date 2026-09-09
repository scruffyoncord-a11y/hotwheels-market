import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — LotClub",
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

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        Terms &amp; Conditions
      </h1>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Last updated: September 10, 2026
      </p>

      <p className="mt-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of LotClub
        (the &ldquo;Platform,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a
        website that lets collectors list, trade, and auction Hot Wheels and diecast cars with
        one another. By creating an account or otherwise using the Platform, you agree to be
        bound by these Terms. If you do not agree, do not use LotClub.
      </p>

      <Section title="1. What LotClub Is (and Isn't)">
        <p>
          LotClub is a venue that connects collectors so they can arrange trades and auctions
          directly with each other. We do not own, inspect, authenticate, sell, buy, ship, or
          take possession of any item listed on the Platform, and we are not a party to any
          trade, auction, or agreement formed between users.
        </p>
        <p>
          Every trade and auction is between the users involved. LotClub does not guarantee the
          existence, condition, authenticity, legality, safety, or value of any item, or that any
          user will complete a trade, honor a winning bid, or act in good faith.
        </p>
      </Section>

      <Section title="2. Eligibility &amp; Accounts">
        <p>
          You must be at least 18 years old, or the age of majority in your jurisdiction, to
          create an account. You are responsible for maintaining the confidentiality of your
          account and for all activity that occurs under it. You must provide accurate
          information and keep it up to date.
        </p>
      </Section>

      <Section title="3. Our No-Scalping Policy">
        <p>
          LotClub exists for genuine collector-to-collector trading and auctions — not for
          scalping, bulk resale, or price manipulation. We reserve the right to remove any
          listing, cancel any trade or auction, and suspend or terminate any account that we
          reasonably believe is being used for scalping, bot-driven bidding, shill bidding, fake
          listings, or any other conduct that undermines a fair marketplace for collectors, at
          our sole discretion and without prior notice.
        </p>
      </Section>

      <Section title="4. User Conduct">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>List counterfeit, stolen, illegal, or unsafe items;</li>
          <li>Misrepresent the condition, authenticity, or ownership of an item;</li>
          <li>Manipulate bids, prices, or reviews, or use bots or automated tools on the Platform;</li>
          <li>Harass, defraud, or threaten another user;</li>
          <li>Attempt to circumvent, disable, or otherwise interfere with the Platform&apos;s security or normal operation; or</li>
          <li>Use the Platform for any purpose that is unlawful or prohibited by these Terms.</li>
        </ul>
        <p>
          We may investigate and take any action we deem appropriate, including removing
          content, suspending or terminating accounts, and reporting conduct to law enforcement,
          for violations of this section.
        </p>
      </Section>

      <Section title="5. Listings, Trades &amp; Auctions">
        <p>
          When you list an item, you represent that you own it and have the right to trade or
          auction it. When you accept a trade proposal or place a winning bid, you are entering
          into a binding arrangement with the other user to complete that trade or sale — LotClub
          is not responsible for enforcing it, but we do provide in-app tools (including a
          two-sided completion confirmation and a reporting system) to help resolve disputes and
          to identify accounts that don&apos;t follow through.
        </p>
        <p>
          Arranging safe handover — meeting in person, using tracked shipping, inspecting an item
          before paying, and confirming details in chat first — is solely your responsibility. We
          are not responsible for lost, damaged, delayed, or non-delivered items, or for any loss
          arising from a trade or auction that isn&apos;t completed as agreed.
        </p>
      </Section>

      <Section title="6. Fees">
        <p>
          LotClub does not currently charge fees to list, trade, or bid. We may introduce fees in
          the future; if we do, we will provide reasonable notice before they apply to you.
        </p>
      </Section>

      <Section title="7. Trademark, Copyright &amp; Intellectual Property">
        <p>
          The LotClub name, logo, and all associated branding are trademarks of LotClub. The
          Platform&apos;s design, layout, text, graphics, and software are the copyrighted property of
          LotClub or its licensors and are protected by applicable intellectual property laws.
          All rights not expressly granted in these Terms are reserved.
        </p>
        <p>
          You retain ownership of the photos, descriptions, and other content you upload
          (&ldquo;User Content&rdquo;). By posting User Content, you grant LotClub a
          non-exclusive, worldwide, royalty-free license to host, store, display, and distribute
          it solely for the purpose of operating and promoting the Platform. You represent that
          you have the right to grant this license for anything you upload.
        </p>
        <p>
          You may not copy, reproduce, modify, distribute, or create derivative works from any
          part of the Platform or its branding without our prior written permission.
        </p>
      </Section>

      <Section title="8. Third-Party Services &amp; Links">
        <p>
          The Platform may link to or rely on third-party services (for example, payment,
          shipping, or notification providers) that we don&apos;t control. We aren&apos;t responsible for
          the content, policies, or practices of any third-party service.
        </p>
      </Section>

      <Section title="9. Disclaimer of Warranties">
        <p>
          THE PLATFORM AND ALL CONTENT ON IT ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
          AVAILABLE,&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING
          (WITHOUT LIMITATION) WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
          TITLE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED,
          ERROR-FREE, OR SECURE, OR THAT ANY ITEM, LISTING, OR USER IS ACCURATELY DESCRIBED,
          GENUINE, OR TRUSTWORTHY.
        </p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, LOTCLUB AND ITS OWNERS, OPERATORS, AND
          AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR AN ITEM ITSELF, ARISING OUT
          OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM, ANY TRADE OR AUCTION, ANY OTHER
          USER&apos;S CONDUCT, OR THESE TERMS — EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF
          SUCH DAMAGES.
        </p>
        <p>
          TO THE EXTENT ANY LIABILITY CANNOT BE FULLY DISCLAIMED UNDER APPLICABLE LAW, LOTCLUB&apos;S
          TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM YOUR USE OF THE PLATFORM WILL NOT
          EXCEED THE GREATER OF (A) THE FEES YOU PAID TO LOTCLUB IN THE 12 MONTHS BEFORE THE
          CLAIM AROSE, OR (B) ₹1,000.
        </p>
      </Section>

      <Section title="11. Indemnification">
        <p>
          You agree to indemnify and hold LotClub, its owners, and operators harmless from any
          claim, loss, liability, or expense (including reasonable legal fees) arising from your
          use of the Platform, your User Content, your violation of these Terms, or your
          violation of any right of another person or entity.
        </p>
      </Section>

      <Section title="12. Suspension &amp; Termination">
        <p>
          We may suspend or terminate your access to the Platform at any time, with or without
          notice, for conduct that we believe violates these Terms, harms other users, or harms
          LotClub. You may stop using the Platform and delete your account at any time.
        </p>
      </Section>

      <Section title="13. Governing Law &amp; Jurisdiction">
        <p>
          These Terms are governed by the laws of India, without regard to conflict-of-law
          principles. Any dispute arising from these Terms or your use of the Platform will be
          subject to the exclusive jurisdiction of the courts of India.
        </p>
      </Section>

      <Section title="14. Changes to These Terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we will post
          the updated Terms on this page with a new &ldquo;Last updated&rdquo; date. Your
          continued use of the Platform after changes take effect constitutes acceptance of the
          updated Terms.
        </p>
      </Section>

      <Section title="15. Contact">
        <p>
          Questions about these Terms can be sent to{" "}
          <a href="mailto:hello@lotclub.in" className="text-orange-600 hover:underline dark:text-orange-400">
            hello@lotclub.in
          </a>
          .
        </p>
      </Section>

      <p className="mt-10 text-xs text-zinc-400 dark:text-zinc-600">
        © {new Date().getFullYear()} LotClub. All rights reserved. LotClub and the LotClub logo
        are trademarks of LotClub.
      </p>
    </main>
  );
}
