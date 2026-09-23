import { NsDetail } from '@/components/ns-detail'

export default async function NsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <NsDetail slug={slug} />
}
