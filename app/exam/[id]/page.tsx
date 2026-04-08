import ExamRunner from '@/components/dashboard/ExamRunner'

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <ExamRunner examId={id} />
}
