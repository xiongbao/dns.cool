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
  discussionNumber: number | null
  discussionUrl: string
  owner: Owner
  createdAt: string
}

export type CurrentUser = {
  id: string
  name: string
  username: string
  avatarUrl: string
}

export type NewSubmission = {
  nameservers: string[]
  description: string
  domains: string[]
  availability: Availability
}

export type FeedTab = 'trending' | 'latest' | 'hall-of-fame'
