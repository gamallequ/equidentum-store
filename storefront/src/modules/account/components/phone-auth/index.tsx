"use client"

import { useActionState, useEffect, useState } from "react"

import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { completeProfile, requestOtp, verifyOtp } from "@lib/data/customer"
import { getStoreName } from "@lib/util/env"

type Step = "phone" | "code" | "profile"

/** Matches the backend's resend cooldown. */
const RESEND_COOLDOWN_SECONDS = 60

/**
 * Sign-in and sign-up in one form, with no email or password:
 *
 *   1. mobile number  -> a code is sent by SMS (WhatsApp as fallback)
 *   2. the code       -> a returning customer is signed in here
 *   3. name and email -> new customers only; this creates the account
 *
 * The address is not asked for here. Checkout asks for it and pre-fills the
 * name and phone from the profile.
 *
 * Once signed in, the server actions revalidate the customer, and the account
 * layout swaps this view for the dashboard by itself.
 */
const PhoneAuth = () => {
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [cooldown, setCooldown] = useState(0)

  const [sendState, sendAction] = useActionState(requestOtp, null)
  const [resendState, resendAction] = useActionState(requestOtp, null)
  const [verifyState, verifyAction] = useActionState(verifyOtp, null)
  const [profileState, profileAction] = useActionState(completeProfile, null)

  useEffect(() => {
    if (sendState?.success && sendState.phone) {
      setPhone(sendState.phone)
      setStep("code")
      setCooldown(RESEND_COOLDOWN_SECONDS)
    }
  }, [sendState])

  useEffect(() => {
    if (resendState?.success) setCooldown(RESEND_COOLDOWN_SECONDS)
  }, [resendState])

  useEffect(() => {
    if (verifyState?.success && verifyState.needsProfile) setStep("profile")
  }, [verifyState])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  return (
    <div className="max-w-sm w-full flex flex-col items-center" data-testid="phone-auth-page">
      {step === "phone" && (
        <>
          <h1 className="text-large-semi uppercase mb-6">Welcome</h1>
          <p className="text-center text-base-regular text-ui-fg-base mb-8">
            Sign in or create your {getStoreName()} account with your mobile number.
          </p>
          <form className="w-full" action={sendAction}>
            <Input
              label="Mobile number"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={phone}
              required
              autoFocus
              data-testid="phone-input"
            />
            <p className="text-small-regular text-ui-fg-subtle mt-2">
              For example 05XXXXXXXX. We&apos;ll text you a code.
            </p>
            <ErrorMessage error={sendState?.error} data-testid="phone-error-message" />
            <SubmitButton data-testid="send-code-button" className="w-full mt-6">
              Continue
            </SubmitButton>
          </form>
        </>
      )}

      {step === "code" && (
        <>
          <h1 className="text-large-semi uppercase mb-6">Enter your code</h1>
          <p className="text-center text-base-regular text-ui-fg-base mb-8">
            We sent a code to <span className="font-semibold" dir="ltr">{phone}</span>.
          </p>
          <form className="w-full" action={verifyAction}>
            <input type="hidden" name="phone" value={phone} />
            <Input
              label="Code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{4,8}"
              maxLength={8}
              required
              autoFocus
              data-testid="code-input"
            />
            <ErrorMessage
              error={verifyState?.error || resendState?.error}
              data-testid="code-error-message"
            />
            <SubmitButton data-testid="verify-code-button" className="w-full mt-6">
              Verify
            </SubmitButton>
          </form>
          <div className="flex w-full justify-between mt-4 text-small-regular">
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="underline"
              data-testid="change-number-button"
            >
              Change number
            </button>
            <form action={resendAction}>
              <input type="hidden" name="phone" value={phone} />
              <button
                type="submit"
                disabled={cooldown > 0}
                className="underline disabled:no-underline disabled:text-ui-fg-muted"
                data-testid="resend-code-button"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </form>
          </div>
        </>
      )}

      {step === "profile" && (
        <>
          <h1 className="text-large-semi uppercase mb-6">Almost done</h1>
          <p className="text-center text-base-regular text-ui-fg-base mb-8">
            Tell us your name and email to finish creating your account.
          </p>
          <form className="w-full" action={profileAction}>
            <div className="flex flex-col w-full gap-y-2">
              <Input
                label="Full name"
                name="full_name"
                autoComplete="name"
                required
                autoFocus
                data-testid="full-name-input"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                data-testid="email-input"
              />
            </div>
            <ErrorMessage error={profileState?.error} data-testid="profile-error-message" />
            <span className="block text-center text-ui-fg-base text-small-regular mt-6">
              By creating an account, you agree to {getStoreName()}&apos;s{" "}
              <LocalizedClientLink href="/content/privacy-policy" className="underline">
                Privacy Policy
              </LocalizedClientLink>{" "}
              and{" "}
              <LocalizedClientLink href="/content/terms-of-use" className="underline">
                Terms of Use
              </LocalizedClientLink>
              .
            </span>
            <SubmitButton data-testid="create-account-button" className="w-full mt-6">
              Create account
            </SubmitButton>
          </form>
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="underline text-small-regular mt-4"
            data-testid="start-over-button"
          >
            Use a different number
          </button>
        </>
      )}
    </div>
  )
}

export default PhoneAuth
