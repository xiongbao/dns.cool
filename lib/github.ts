import 'server-only'

export const DISCUSSIONS_REPO =
  process.env.GITHUB_DISCUSSIONS_REPO ?? 'dns-cool/showcase'

const GITHUB_GRAPHQL = 'https://api.github.com/graphql'

type DiscussionResult = { number: number; url: string }

async function graphql<T>(query: string, variables: Record<string, unknown>) {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] }
  if (!res.ok || json.errors?.length) {
    throw new Error(
      json.errors?.map((e) => e.message).join('; ') ??
        `GitHub GraphQL error (${res.status})`,
    )
  }
  return json.data as T
}

/**
 * Fetch the authenticated GitHub identity behind a user's stored OAuth access
 * token, so entries are attributed to the real GitHub handle + avatar.
 */
export async function fetchGithubIdentity(accessToken: string) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = (await res.json()) as { login?: string; avatar_url?: string }
  if (!data.login) return null
  return { login: data.login, avatarUrl: data.avatar_url ?? '' }
}

/**
 * Create a paired GitHub Discussion for a newly published NS entry. Returns
 * null (rather than throwing) if Discussions are unavailable so publishing
 * still succeeds — the entry simply links to the repo's discussions index.
 */
export async function createDiscussion(input: {
  title: string
  body: string
}): Promise<DiscussionResult | null> {
  const [owner, name] = DISCUSSIONS_REPO.split('/')
  if (!owner || !name || !process.env.GITHUB_TOKEN) return null

  try {
    const repo = await graphql<{
      repository: {
        id: string
        discussionCategories: { nodes: { id: string; name: string }[] }
      } | null
    }>(
      `query ($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          id
          discussionCategories(first: 20) { nodes { id name } }
        }
      }`,
      { owner, name },
    )

    const repository = repo.repository
    const categories = repository?.discussionCategories.nodes ?? []
    if (!repository || categories.length === 0) return null

    // Prefer an announcement-friendly category, else the first available one.
    const preferred =
      categories.find((c) => /show|general|announce/i.test(c.name)) ??
      categories[0]

    const created = await graphql<{
      createDiscussion: { discussion: { number: number; url: string } }
    }>(
      `mutation ($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
        createDiscussion(input: {
          repositoryId: $repositoryId,
          categoryId: $categoryId,
          title: $title,
          body: $body
        }) {
          discussion { number url }
        }
      }`,
      {
        repositoryId: repository.id,
        categoryId: preferred.id,
        title: input.title,
        body: input.body,
      },
    )

    return created.createDiscussion.discussion
  } catch (error) {
    console.log('[v0] createDiscussion failed:', (error as Error).message)
    return null
  }
}
