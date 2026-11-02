"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { transferCart } from "./cart"
import { HttpTypes } from "@medusajs/types"
import { redirect } from "next/navigation"
import { cache } from "react"
import {
  getAuthHeaders,
  getCacheDirectives,
  getPendingAuthToken,
  removeAuthToken,
  removePendingAuthToken,
  revalidateCacheTag,
  setAuthToken,
  setPendingAuthToken,
} from "./cookies"

// See the note in regions.ts for why this is a client.fetch call rather than
// the sdk.store.* helper. This one is worth spelling out: the old call put the
// cache tag and the authorization header in the same object, so the auth half
// worked and the caching half silently did nothing.
export const getCustomer = cache(async function () {
  return await sdk.client
    .fetch<HttpTypes.StoreCustomerResponse>("/store/customers/me", {
      method: "GET",
      headers: { ...(await getAuthHeaders()) },
      ...(await getCacheDirectives("customers")),
    })
    .then(({ customer }) => customer)
    .catch(() => null)
})

export const updateCustomer = cache(async function (
  body: HttpTypes.StoreUpdateCustomer
) {
  const updateRes = await sdk.store.customer
    .update(body, {}, await getAuthHeaders())
    .then(({ customer }) => customer)
    .catch(medusaError)

  await revalidateCacheTag("customers")
  return updateRes
})

/**
 * Phone sign-in. One form, three steps: phone number, code, then name and
 * email for new customers only. Sign-in and sign-up are the same flow.
 *
 * The backend's "phone-otp" provider sends and checks the codes. These call
 * its routes with sdk.client.fetch rather than sdk.auth.login and
 * sdk.auth.callback. The SDK's callback sends the code as a GET query
 * string, which ends up in access logs, and both SDK helpers keep the token
 * in the SDK instance. That instance is shared across every visitor on the
 * server.
 */
export type PhoneAuthState = {
  success: boolean
  error: string | null
  /** The number as the shopper typed it, kept for the next step and resends. */
  phone?: string
  /** Code verified, but this phone has no customer yet: ask for name and email. */
  needsProfile?: boolean
} | null

const phoneFail = (error: string, phone?: string): PhoneAuthState => ({
  success: false,
  error,
  phone,
})

const errorMessage = (error: any) => error?.message ?? String(error)

/** Reads a JWT's payload without verifying it. Only used to check actor_id. */
const tokenActorId = (token: string): string => {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    )
    return typeof payload?.actor_id === "string" ? payload.actor_id : ""
  } catch {
    return ""
  }
}

const refreshToken = async (token: string): Promise<string> => {
  const { token: refreshed } = await sdk.client.fetch<{ token: string }>(
    "/auth/token/refresh",
    { method: "POST", headers: { authorization: `Bearer ${token}` } }
  )
  return refreshed
}

const linkExistingCustomer = (token: string) =>
  sdk.client.fetch<{ linked: boolean; phone?: string }>(
    "/store/phone-auth/link",
    { method: "POST", headers: { authorization: `Bearer ${token}` } }
  )

/** Starts the session for a token that carries a customer id. */
const completeSignIn = async (token: string) => {
  await removePendingAuthToken()
  await setAuthToken(token)
  await transferCart(token)
  await revalidateCacheTag("customers")
}

/** Step 1: text a code to the number. Also used for "resend code". */
export async function requestOtp(
  _currentState: PhoneAuthState,
  formData: FormData
): Promise<PhoneAuthState> {
  const phone = (formData.get("phone") as string)?.trim()

  if (!phone) {
    return phoneFail("Enter your mobile number.")
  }

  try {
    await sdk.client.fetch("/auth/customer/phone-otp", {
      method: "POST",
      body: { phone },
    })
    return { success: true, error: null, phone }
  } catch (error) {
    return phoneFail(errorMessage(error), phone)
  }
}

/**
 * Step 2: check the code. Signs in a returning customer straight away,
 * including one who registered with email before phone sign-in, who is
 * linked by phone number. Anyone else is sent on to completeProfile.
 */
export async function verifyOtp(
  _currentState: PhoneAuthState,
  formData: FormData
): Promise<PhoneAuthState> {
  const phone = (formData.get("phone") as string)?.trim()
  const code = (formData.get("code") as string)?.replace(/\s/g, "")

  if (!phone) {
    return phoneFail("Enter your mobile number.")
  }
  if (!code) {
    return phoneFail("Enter the code we sent you.", phone)
  }

  try {
    const { token } = await sdk.client.fetch<{ token: string }>(
      "/auth/customer/phone-otp/callback",
      { method: "POST", body: { phone, otp: code } }
    )

    if (tokenActorId(token)) {
      await completeSignIn(token)
      return { success: true, error: null, phone }
    }

    const { linked } = await linkExistingCustomer(token)
    if (linked) {
      await completeSignIn(await refreshToken(token))
      return { success: true, error: null, phone }
    }

    await setPendingAuthToken(token)
    return { success: true, error: null, phone, needsProfile: true }
  } catch (error) {
    return phoneFail(errorMessage(error), phone)
  }
}

/**
 * Step 3, new customers only: create the customer from a full name and an
 * email, then sign in. The address is asked for at checkout instead.
 */
export async function completeProfile(
  _currentState: PhoneAuthState,
  formData: FormData
): Promise<PhoneAuthState> {
  const fullName = ((formData.get("full_name") as string) ?? "")
    .trim()
    .replace(/\s+/g, " ")
  const email = (formData.get("email") as string)?.trim()

  if (!fullName || !email) {
    return phoneFail("Enter your full name and email.")
  }

  const token = await getPendingAuthToken()
  if (!token) {
    return phoneFail(
      "Your verification has expired. Enter your number again to get a new code."
    )
  }

  // "Mohamed Gamal Ali" becomes first "Mohamed", last "Gamal Ali".
  const [firstName, ...rest] = fullName.split(" ")
  const lastName = rest.join(" ")

  try {
    // The link route also returns the normalized number, so the customer
    // gets the same phone the sign-in uses. Checking again here also covers
    // an account linked in another tab since the code was verified.
    const { linked, phone } = await linkExistingCustomer(token)

    if (!linked) {
      await sdk.store.customer.create(
        {
          email,
          first_name: firstName,
          ...(lastName ? { last_name: lastName } : {}),
          ...(phone ? { phone } : {}),
        },
        {},
        { authorization: `Bearer ${token}` }
      )
    }

    // The pending token has no customer on it; a refresh issues one that does.
    await completeSignIn(await refreshToken(token))
    return { success: true, error: null }
  } catch (error) {
    const message = errorMessage(error)
    if (/already (has an account|exists)/i.test(message)) {
      return phoneFail(
        "This email already belongs to another account. Use a different email."
      )
    }
    return phoneFail(message)
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()
  await removeAuthToken()
  await revalidateCacheTag("auth")
  await revalidateCacheTag("customers")
  redirect(`/${countryCode}/account`)
}

export const addCustomerAddress = async (
  _currentState: unknown,
  formData: FormData
): Promise<any> => {
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .createAddress(address, {}, await getAuthHeaders())
    .then(async () => {
      await revalidateCacheTag("customers")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  await sdk.store.customer
    .deleteAddress(addressId, await getAuthHeaders())
    .then(async () => {
      await revalidateCacheTag("customers")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId = currentState.addressId as string

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, await getAuthHeaders())
    .then(async () => {
      await revalidateCacheTag("customers")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
