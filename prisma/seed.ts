import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Seed initial company
  const company = await prisma.company.upsert({
    where: { id: 'seed-company' },
    update: {},
    create: {
      id: 'seed-company',
      name: 'Hatwan Company',
      ceoName: 'Mohammed Ahmed Ali'
    }
  })

  // Create branches
  const [mainBranch, kurdistanBranch] = await Promise.all([
    prisma.branch.upsert({
      where: { id: 'seed-branch-1' },
      update: { companyId: company.id },
      create: {
        id: 'seed-branch-1',
        companyId: company.id,
        name: 'Erbil Main Branch',
        location: 'Erbil, Kurdistan'
      }
    }),
    prisma.branch.upsert({
      where: { id: 'seed-branch-2' },
      update: { companyId: company.id },
      create: {
        id: 'seed-branch-2',
        companyId: company.id,
        name: 'Sulaymaniyah Branch',
        location: 'Sulaymaniyah, Kurdistan'
      }
    })
  ])

  // Create departments
  const [itDept, adminDept, opsDept] = await Promise.all([
    prisma.department.upsert({
      where: { id: 'seed-dept-1' },
      update: { companyId: company.id, branchId: mainBranch.id },
      create: {
        id: 'seed-dept-1',
        companyId: company.id,
        branchId: mainBranch.id,
        name: 'Information Technology'
      }
    }),
    prisma.department.upsert({
      where: { id: 'seed-dept-2' },
      update: { companyId: company.id, branchId: mainBranch.id },
      create: {
        id: 'seed-dept-2',
        companyId: company.id,
        branchId: mainBranch.id,
        name: 'Administration'
      }
    }),
    prisma.department.upsert({
      where: { id: 'seed-dept-3' },
      update: { companyId: company.id, branchId: kurdistanBranch.id },
      create: {
        id: 'seed-dept-3',
        companyId: company.id,
        branchId: kurdistanBranch.id,
        name: 'Operations'
      }
    })
  ])

  const adminPassword = await bcrypt.hash('hatwan@123', 12)
  const employeePassword = await bcrypt.hash('staff@123', 12)

  // Create users
  const [ceo, admin, itDeptHead, employee1, employee2] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ceo@hatwan.com' },
      update: {},
      create: {
        email: 'ceo@hatwan.com',
        name: 'Mohammed Ahmed Ali',
        passwordHash: adminPassword,
        role: 'CEO',
        companyId: company.id,
        branchId: mainBranch.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'admin@hatwan.com' },
      update: {},
      create: {
        email: 'admin@hatwan.com',
        name: 'Company Administrator',
        passwordHash: adminPassword,
        role: 'COMPANY_ADMIN',
        companyId: company.id,
        branchId: mainBranch.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'it.head@hatwan.com' },
      update: {},
      create: {
        email: 'it.head@hatwan.com',
        name: 'IT Department Head',
        passwordHash: adminPassword,
        role: 'DEPT_HEAD',
        companyId: company.id,
        branchId: mainBranch.id,
        departmentId: itDept.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'employee1@hatwan.com' },
      update: {},
      create: {
        email: 'employee1@hatwan.com',
        name: 'Zana Karim',
        passwordHash: employeePassword,
        role: 'EMPLOYEE',
        companyId: company.id,
        branchId: mainBranch.id,
        departmentId: itDept.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'employee2@hatwan.com' },
      update: {},
      create: {
        email: 'employee2@hatwan.com',
        name: 'Ava Rashid',
        passwordHash: employeePassword,
        role: 'EMPLOYEE',
        companyId: company.id,
        branchId: kurdistanBranch.id,
        departmentId: opsDept.id
      }
    })
  ])

  // Sample approved request for testing reports
  const approvedYear = new Date().getFullYear()
  await prisma.request.upsert({
    where: { id: 'seed-request-1' },
    update: {},
    create: {
      id: 'seed-request-1',
      companyId: company.id,
      departmentId: itDept.id,
      requesterId: employee1.id,
      itemName: 'Dell Latitude 7450 Laptop',
      explanation:
        'Replacement laptop for the senior network engineer position to support virtualization lab work.',
      necessityRating: 8,
      estimatedCost: 1450,
      status: 'APPROVED',
      reviewDate: new Date(`${approvedYear}-03-15T10:00:00Z`),
      reviewedBy: itDeptHead.id
    }
  })

  // Sample pending request
  await prisma.request.upsert({
    where: { id: 'seed-request-2' },
    update: {},
    create: {
      id: 'seed-request-2',
      companyId: company.id,
      departmentId: adminDept.id,
      requesterId: employee2.id,
      itemName: 'Office Chairs (x5)',
      explanation:
        'Ergonomic chairs for the administration staff as the current ones are damaged.',
      necessityRating: 6,
      estimatedCost: 900,
      status: 'PENDING'
    }
  })

  console.log('Seed data created successfully!')
  console.log('Users:')
  console.log('  CEO:      ceo@hatwan.com / hatwan@123')
  console.log('  Admin:    admin@hatwan.com / hatwan@123')
  console.log('  DeptHead: it.head@hatwan.com / hatwan@123')
  console.log('  Employee: employee1@hatwan.com / staff@123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
