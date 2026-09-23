import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import RequestPrintLayout from '@/components/print/RequestPrintLayout'

export const dynamic = 'force-dynamic'

export default async function PrintRequestPage({ params }: { params: { id: string } }) {
  const request = await prisma.request.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      department: true,
      requester: { select: { name: true, role: true } }
    }
  })

  if (!request) {
    notFound()
  }

  return (
    <RequestPrintLayout
      companyName={request.company.name}
      departmentName={request.department.name}
      requesterName={request.requester.name}
      requesterRole={request.requester.role}
      itemName={request.itemName}
      explanation={request.explanation}
      rating={request.necessityRating}
      estimatedCost={request.estimatedCost}
      ceoName={request.company.ceoName}
      approvalStatus={
        request.status === 'APPROVED' || request.status === 'REJECTED' ? request.status : undefined
      }
      reviewDate={request.reviewDate?.toISOString()}
      requestDate={request.requestDate.toISOString()}
      requestRef={request.id}
    />
  )
}