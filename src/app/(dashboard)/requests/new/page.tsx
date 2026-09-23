import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminRole } from '@/lib/roles'
import { EmployeeRequestForm } from '@/components/requests/EmployeeRequestForm'
import { AdminRequestForm } from '@/components/requests/AdminRequestForm'

export const dynamic = 'force-dynamic'

export default async function NewRequestPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? 'EMPLOYEE'

  return isAdminRole(role) ? <AdminRequestForm /> : <EmployeeRequestForm />
}
