export type Availability = 'public' | 'private'

export type Owner = {
  username: string
  avatarUrl: string
}

export type NsEntry = {
  id: string
  slug: string
  nameservers: string[]
  description: string
  domains: string[]
  availability: Availability
  verified: boolean
  votes: number
  comments: number
  discussionNumber: number
  owner: Owner
  createdAt: string
}

export type FeedTab = 'trending' | 'latest' | 'hall-of-fame'

export const DISCUSSIONS_REPO = 'dns-cool/showcase'

export function discussionUrl(number: number) {
  return `https://github.com/${DISCUSSIONS_REPO}/discussions/${number}`
}
