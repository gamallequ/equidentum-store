import { HttpTypes } from "@medusajs/types"

type Props = {
  customer: HttpTypes.StoreCustomer
}

/**
 * Read-only. The mobile number is what the customer signs in with, so
 * changing it here would lock them out of their own account. A number change
 * needs its own verified flow: send a code to the new number, then move the
 * sign-in over.
 */
const ProfilePhone = ({ customer }: Props) => {
  return (
    <div className="text-small-regular" data-testid="account-phone">
      <div className="flex flex-col">
        <span className="uppercase text-ui-fg-base">Mobile number</span>
        <span className="font-semibold" dir="ltr" data-testid="current-info">
          {customer.phone || "-"}
        </span>
        <span className="text-ui-fg-subtle mt-1">
          This is the number you sign in with.
        </span>
      </div>
    </div>
  )
}

export default ProfilePhone
