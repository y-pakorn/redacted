import { SiteConfig } from "@/types"

import { env } from "@/env.mjs"

export const siteConfig: SiteConfig = {
  name: "Redacted",
  author: "yoisha & yoyoismee",
  description: "",
  keywords: [],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "yoisha & yoyoismee",
  },
  links: {
    github: "https://github.com/y-pakorn/redacted",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/og.jpg`,
}
