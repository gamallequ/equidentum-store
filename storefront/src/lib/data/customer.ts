"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { redirect } from "next/navigation"
import { cache } from "react"
import {
  getAuthHeaders,
  getCacheDirectives,
  removeAuthToken,
  revalidateCacheTag,
  setAuthToken,
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

export type AuthFormState = { success: boolean; error: string | null } | null

const fail = (error: string): AuthFormState => ({ success: false, error })

const emailpassLogin = async (email: string, password: string) => {
  const token = await sdk.auth.login("customer", "emailpass", {
    email,
    password,
  })

  // emailpass always returns a token string. The other shapes in the union are
  // OAuth redirect, MFA challenge and pending email verification, none of
  // which this storefront implements.
  return typeof token === "string" ? token : null
}

/**
 * Registers a customer.
 *
 * Medusa splits this into two records: an auth identity (register) and the
 * customer row the admin lists (customer.create). They are separate requests,
 * so the second can fail after the first succeeded, leaving an identity with
 * no customer. Every later attempt then failed with "Identity with email
 * already exists" and the account could never be finished. When register
 * reports the identity exists, this signs in with the submitted password and
 * creates the missing customer row if there is none, which repairs those
 * half-made accounts instead of locking them out.
 *
 * Returns a plain state object. It used to return the created customer, which
 * the form handed to ErrorMessage, and rendering an object crashed the page on
 * every successful signup.
 */
export async function signup(
  _currentState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string
  const firstName = (formData.get("first_name") as string)?.trim()
  const lastName = (formData.get("last_name") as string)?.trim()
  const phone = (formData.get("phone") as string)?.trim()

  if (!email || !password || !firstName || !lastName) {
    return fail("Fill in your name, email and password.")
  }

  // Optional fields are only sent when filled in. An empty string is not the
  // same as absent to Medusa's validators.
  const customerForm: HttpTypes.StoreCreateCustomer = {
    email,
    first_name: firstName,
    last_name: lastName,
    ...(phone ? { phone } : {}),
  }

  try {
    let registrationToken: string | null = null

    try {
      registrationToken = await sdk.auth.register("customer", "emailpass", {
        email,
        password,
      })
    } catch (error: any) {
      if (!/already exists/i.test(error?.message ?? String(error))) {
        throw error
      }
    }

    if (registrationToken) {
      await sdk.store.customer.create(
        customerForm,
        {},
        { authorization: `Bearer ${registrationToken}` }
      )
    } else {
      // The identity exists already. Signing in proves the password is theirs
      // before anything is created against it.
      let existingToken: string | null
      try {
        existingToken = await emailpassLogin(email, password)
      } catch {
        return fail(
          "An account with this email already exists. Sign in instead, or reset your password."
        )
      }

      if (!existingToken) {
        return fail("This account requires a sign-in step that is not supported here.")
      }

      const hasCustomer = await sdk.client
        .fetch("/store/customers/me", {
          method: "GET",
          headers: { authorization: `Bearer ${existingToken}` },
        })
        .then(() => true)
        .catch(() => false)

      if (!hasCustomer) {
        await sdk.store.customer.create(
          customerForm,
          {},
          { authorization: `Bearer ${existingToken}` }
        )
      }
    }

    // A fresh login is required either way: the registration token, and a
    // token issued before the customer existed, carry no customer id.
    const loginToken = await emailpassLogin(email, password)

    if (!loginToken) {
      return fail("Account created, but automatic sign-in is not available. Please sign in.")
    }

    await setAuthToken(loginToken)
    await revalidateCacheTag("customers")
    return { success: true, error: null }
  } catch (error: any) {
    return fail(error?.message ?? String(error))
  }
}

export async function login(
  _currentState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string

  try {
    const token = await emailpassLogin(email, password)

    if (!token) {
      return fail("This account requires a sign-in step that is not supported here.")
    }

    await setAuthToken(token)
    await revalidateCacheTag("customers")
    return { success: true, error: null }
  } catch (error: any) {
    return fail(error?.message ?? String(error))
  }
}

/**
 * Asks Medusa to mail a reset link.
 *
 * Always reports success, including for an address with no account. That is
 * not a shortcut: the backend route answers 201 either way on purpose, so the
 * form cannot be used to work out which email addresses have accounts here. It
 * is also why the copy says "if an account exists" rather than "check your
 * inbox". The email itself is sent by backend/src/subscribers/password-reset.ts.
 */
export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const email = (formData.get("email") as string)?.trim()

  if (!email) {
    return { success: false, error: "Enter the email address on your account." }
  }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", { identifier: email })
    return { success: true, error: null }
  } catch (error: any) {
    // A failure here is the request never reaching Medusa, not a rejected
    // address, so it is worth surfacing rather than swallowing.
    return { success: false, error: error.toString() }
  }
}

/**
 * Sets a new password from a reset token.
 *
 * The token identifies the account. `POST /auth/{actor}/{provider}/update`
 * takes the identity from the validated token and ignores any identifier in
 * the body, so nothing here decides whose password changes. The email shown on
 * the form is display only.
 */
export async function resetPassword(
  _currentState: unknown,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const token = formData.get("token") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirm_password") as string

  if (!token) {
    return {
      success: false,
      error: "This reset link is missing its token. Request a new one.",
    }
  }

  if (!password || password.length < 8) {
    return { success: false, error: "Use a password of at least 8 characters." }
  }

  if (password !== confirmPassword) {
    return { success: false, error: "The two passwords do not match." }
  }

  try {
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { password },
      token
    )
    return { success: true, error: null }
  } catch (error: any) {
    // The token is single use and expires after 15 minutes, and both cases come
    // back as a 401 with no detail worth showing raw.
    return {
      success: false,
      error:
        "This reset link is no longer valid. It can only be used once and expires after 15 minutes. Request a new one below.",
    }
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
