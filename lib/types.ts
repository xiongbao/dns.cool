export type Availability = 'public' | 'private'

export type EntryStatus = 'active' | 'pending' | 'invalid' | 'banned'

export type UserRole = 'user' | 'admin'

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
  status: EntryStatus
  featured: boolean
  verificationToken: string | null
  votes: number
  comments: number
  discussionNumber: number | null
  discussionUrl: string
  owner: Owner
  userId: string | null
  createdAt: string
}

export type CurrentUser = {
  id: string
  name: string
  username: string
  avatarUrl: string
  role: UserRole
}

export type NewSubmission = {
  nameservers: string[]
  description: string
  domains: string[]
  availability: Availability
  verificationToken?: string | null
}

export type FeedTab = 'trending' | 'latest' | 'hall-of-fame'
