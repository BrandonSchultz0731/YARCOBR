# Plan: make the contact form actually send

Working document. Nothing here is built yet — this is the agreed approach and
the checklist to get there.

**Status:** built and verified on `feature/contact-form-web3forms`; Phases 1–4
done. **Blocked on the production key** — the page still carries Brandon's dev
key and must not merge until that is swapped for one bound to Daniel's email.

---

## The problem

GitHub Pages serves files and cannot run code, so the site has no way to send
an email itself. The contact form and the "Email Daniel" / "Email Matt"
buttons all use `mailto:`, which hands the message to whatever mail app the
_visitor's_ computer has registered.

On a machine with no registered mail handler, a `mailto:` click does nothing
at all — no error, no feedback, nothing the page can detect. This was
confirmed on a real machine: typing `mailto:test@example.com` straight into
the Chrome address bar also did nothing, which rules out the website as the
cause.

This matters more here than on a typical site. The July 2026 survey puts
40.7% of respondents at 60–69 and 29.6% over 80 — the group most likely to
read mail at gmail.com in a browser and never have configured a desktop mail
client. `mailto:` is a bad bet for a large share of this audience, and every
failure is silent and invisible to Daniel.

## The decision

**Web3Forms**, a form-to-email service. The form POSTs to their endpoint and
they email Daniel.

Chosen because it keeps the current architecture intact — still static, still
GitHub Pages, still no build step. The alternatives (moving hosting to
Netlify, or running our own serverless function) buy control this site has no
use for and add maintenance to a project deliberately built to need none.

### Why Web3Forms over the others

|               | Free/month | Retention | Track record                            |
| ------------- | ---------- | --------- | --------------------------------------- |
| **Web3Forms** | 250        | 30 days   | Several years, widely used              |
| Formspree     | 50         | 30 days   | Since ~2014, incumbent                  |
| Formtorch     | 150        | —         | New; small team, no public track record |

Web3Forms wins on quota headroom (5× Formspree) and needs no account — the
key arrives by email. On a site whose premise is that non-technical people can
keep it running, one fewer login has real value.

Formtorch was considered and passed over. Not a bad product, but a form
backend fails _silently_, and the maintainers here would have no way to
notice. Longevity is the dominant criterion and a new entrant can't yet
provide evidence on it.

**Cost: $0.** ~360 units; realistic volume is 2–15 submissions/month against a
250 cap. Note that spam counts against the quota.

---

## Phase 0 — Brandon (blocks everything else)

**An access key is permanently bound to one email address.** One email, one
key — it cannot be reassigned later, and the destination cannot be overridden
in the POST body (if it could, anyone could use the key to send mail anywhere,
so this is a deliberate anti-relay design). Changing the recipient means
generating a new key and swapping one line of HTML.

That makes a two-key workflow the right sequence:

- [x] **Dev key — Brandon's email.** Get it at web3forms.com; it arrives by
      email, no account or password. All testing (failure paths, honeypot,
      bad-key errors, double-submit) then lands in Brandon's inbox instead of
      cluttering Daniel's with a dozen test messages.
- [x] Hand over the dev key; build and test against it. In the page as
      `9bd04844-…`, confirmed bound to Brandon's account.
- [ ] **Production key — Daniel's email.** Generate a second key at go-live
      and swap the one line. Keys are free, so this costs nothing.
- [ ] Re-run one real end-to-end test after the swap — a passing test on the
      dev key proves nothing about the production one.
- [ ] **After go-live:** have Daniel whitelist the sender in Gmail.
      Notifications come from Web3Forms' domain, not from the visitor, so
      they're spam-filter candidates. This is the most likely way to lose a
      message.

Do **not** leave Brandon's address in the production path and forward to
Daniel. It adds a hop and a delay, and makes the developer a single point of
failure for the business's leads. Submissions should land directly with the
person who acts on them.

Known tension, no clean fix on the free tier: the key's owner also receives
Web3Forms' service notices (quota warnings, terms changes). Those ideally go
to the maintainer while submissions go to Daniel, but one address covers both.
Resolved in favour of submissions going direct; the quarterly test below is
the compensating control.

> The access key lives in the page's HTML and will be publicly visible in this
> repo. That is by design — it identifies the destination, it is not a
> password. It does mean anyone can read it and POST to it, so enable domain
> restriction if Web3Forms offers it, and keep the honeypot.

## Phase 1 — Form markup ✅

- [x] **Add `name` attributes to all five fields.** They currently have only
      `id`. Web3Forms reads by `name`, so without this it receives five blank
      values _and still reports success_. Hard blocker.
- [x] Add hidden `access_key`, plus `subject` and `from_name` so the
      notification has a useful subject line.
- [x] Add a honeypot field, hidden with CSS rather than `type="hidden"` —
      bots skip truly hidden inputs but fill ones visible in the DOM.
      No CAPTCHA: 29.6% of residents are over 80 and that's where they'd
      abandon.
- [x] Set `action` + `method="POST"` on the form and drop
      `onsubmit="return false;"`. With a real action the form still works if
      JavaScript fails, instead of doing nothing.
- [x] Make the Subject dropdown values human-readable. The JS currently maps
      `showing` → "Schedule a Showing"; with a real backend the raw value gets
      posted. Done by putting the full subject line in each option's `value`
      and keeping the old slug in `data-key`, which is what the "Other Ways We
      Can Help" links target.

> Phase 1 alone left the branch mid-refactor — the form POSTed natively _and_
> the old `mailto:` listener still ran. Phase 2 closed that.

## Phase 2 — Submission logic ✅

- [x] Replace the `mailto:` handler with a `fetch()` POST; check the JSON
      response.
- [x] Add the three states the form lacks today — sending (button disabled,
      label changes), sent, failed. Currently there is only one.
- [x] Guard against double submission while a request is in flight. The
      disabled button is not enough on its own: Enter in a text field submits
      the form without touching it, so an in-flight flag does the real work.
- [x] Handle both failure modes: network error, and a response with
      `success: false`. Both fall back to the existing copy-message path.
      A third was found and covered — a response whose body will not parse as
      JSON.
- [x] Reset the form on success. Deliberately _not_ on failure: the visitor
      keeps what they typed, and the copy button hands it back.

Two things learned by probing the live endpoint:

- **A rejection comes back as a non-2xx status with a JSON body.** An invalid
  key returns HTTP 403 and `{"success": false, "message": …}`. So the response
  must be parsed regardless of `response.ok` — branching on the status alone
  would throw away the reason.
- **Server-side requests are blocked on the free tier.** `curl` with no Origin
  gets _"This method is not allowed. Use our API in client side"_. Phase 4's
  end-to-end test therefore has to run in a real browser; a shell one-liner
  will fail for reasons that have nothing to do with our code.

## Phase 3 — Copy and accessibility ✅

- [x] Rewrite the confirmation so it says _sent_ — truthfully, which is the
      entire point of this work. Done in Phase 2 rather than left for later:
      the old wording ("we handed it to your email app") became false the
      moment the `fetch()` landed, and shipping a knowingly wrong message
      across two commits is worse than moving one item early.
- [x] Move focus to the confirmation on success so screen readers announce it.
      Done for the failure panel too, which is where the recovery options are.
      The live-region roles stay as a backstop: several screen readers miss a
      region that was `hidden` at page load, so focus is the dependable half
      and the role is the cheap insurance.
- [x] Revisit "Your information is kept private and will never be shared" now
      that submissions pass through a third party. It did not survive the
      look — Web3Forms now handles every submission, so an unqualified "never
      shared" was no longer true. Replaced with what is actually promised:
      _"We only use your details to reply to you — never for a mailing list,
      and never sold to anyone."_
- [x] Leave the email buttons and Copy address exactly as they are — the
      redundant path if the service is ever down.

## Phase 4 — Verification ✅

All five run by hand in a real browser against the dev key, all passed.

- [x] Real end-to-end test against the live endpoint; confirm the message
      actually arrives. Not a mock.
- [x] Force the failure path with a bad key; confirm the error state renders
      rather than dying silently.
- [x] Test with JavaScript disabled (native POST fallback). Note the header
      nav and footer are blank in this mode — they are injected by
      `js/components.js` and vanish site-wide with JavaScript off. Pre-existing,
      unrelated to the form.
- [x] Submit with the honeypot filled; confirm rejection. The error panel
      appearing is the _pass_ here — it proves the honeypot rejection travels
      the same failure path as everything else.
- [x] Mobile check (emulated). A real handset still gets checked after deploy,
      in Phase 5 — the emulator can't show the on-screen keyboard covering the
      Send button.

Automated alongside these, and worth re-running after any edit to the form:
60 assertions in the scratchpad checks — markup/payload, the fetch path
(success, rejection, network failure, unparseable body, triple-submit,
honeypot), and focus/copy.

## Phase 5 — Ship

**Order matters here.** The page currently carries Brandon's dev key. Merging
as-is would put a working form on the live site that delivers residents'
enquiries to the developer instead of the agent — worse than the broken form
it replaces, because it looks like it works. Swap the key first.

- [x] Update `README.md` — its "Contact form" section said the form opens the
      visitor's email client, which is now wrong.
- [ ] **Generate the production key on Daniel's email and swap the one line.**
      Blocks the merge.
- [ ] One real end-to-end submit against the production key, confirmed in
      Daniel's inbox. A pass on the dev key proves nothing about this one.
- [ ] Merge to `main` and push.
- [ ] Live test from liveyarcobr.com after the deploy settles. Assets are
      served with `max-age=600`, so a stale copy can look like a failure.
- [ ] Real handset check on the live URL (carried over from Phase 4).
- [ ] Daniel whitelists the sender in Gmail — see Phase 0. Most likely way to
      lose a message.
- [ ] Brief Daniel and Matt on what arrives and where.

## Ongoing

Silent failure is the real risk. Daniel should send himself a test message
through the form once a quarter — thirty seconds, and it's the only thing that
catches a dead backend before a lost lead does.

---

## Open decisions

1. ~~**Does Matt receive submissions too?**~~ **Answered:** adding additional
   recipients ("co-workers") is a PRO feature, so not available on free. On
   the free tier the workaround is a Gmail filter on Daniel's side that
   auto-forwards YARCOBR submissions to Matt. Decide whether that's wanted.
2. ~~**The no-JS path.**~~ **Decided: leave it.** Without JavaScript the
   browser navigates to Web3Forms' own success page rather than staying here.
   Off-brand, but it works, and nobody hits it in normal use — the in-page
   "Message sent" banner covers everyone with JavaScript on. Not worth a
   thank-you page and the extra `redirect` field to maintain. Revisit only if
   the analytics ever show real traffic landing there.
3. **Autoresponder to the visitor?** Looks like a paid feature on the free
   tier — verify. Good reassurance for this audience if cheap.

## Risks

- **Free tier terms can change.** Mitigation is already on the page: visible
  email addresses and the Copy address button, so a broken form never means
  visitors can't reach you.
- **30-day retention means email is the only durable record.** If Gmail
  spam-filters a notification, the lead is gone. Hence the whitelist step.
- **Spam consumes quota.** Honeypot plus domain restriction should keep this
  well under 250/month.
- **Resident PII passes through a third party** — names, emails, phone
  numbers. Normal practice, but a knowing choice rather than an accident.

## Estimate

~20 minutes of implementation once the key exists, plus testing.
