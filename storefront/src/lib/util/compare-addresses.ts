// The fields checkout collects. Last name, company and postal code are not
// asked for any more, so they are left out: an address saved with them still
// matches the same address entered at checkout. Empty and missing values
// count as equal, since the API returns null where the form has "".
const FIELDS = [
  "first_name",
  "address_1",
  "city",
  "country_code",
  "province",
  "phone",
] as const

const norm = (value: unknown) => (value == null ? "" : String(value).trim())

export default function compareAddresses(address1: any, address2: any) {
  if (!address1 || !address2) return false
  return FIELDS.every((f) => norm(address1[f]) === norm(address2[f]))
}
