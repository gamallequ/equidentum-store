// The admin is built with Vite, which turns these imports into asset URLs.
declare module "*.png" {
  const url: string
  export default url
}

declare module "*.ico" {
  const url: string
  export default url
}
