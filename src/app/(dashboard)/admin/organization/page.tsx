'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner
} from '@/components/ui'
import { useI18n } from '@/i18n/I18nProvider'

type Department = { id: string; name: string; companyId: string; branchId?: string | null }
type UserRow = {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  departmentId?: string | null
}
type Company = { id: string; name: string; ceoName: string; departments: Department[]; users: UserRow[] }

const ROLES = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CEO']

export default function OrganizationAdminPage() {
  const { t } = useI18n()
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/companies')
      if (!res.ok) throw new Error('load failed')
      setCompanies(await res.json())
      setError(null)
    } catch {
      setError(t('org.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const api = async (
    url: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: Record<string, unknown>
  ) => {
    setSuccess(null)
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    if (!res.ok) {
      let message = t('org.operationFailed')
      try {
        const data = await res.json()
        if (data?.error) message = data.error
      } catch {
        /* ignore */
      }
      setError(message)
      throw new Error(message)
    }
    setError(null)
    await load()
  }

  const company = companies.find((c) => c.id === companyId) ?? null
  const departments = company?.departments ?? []
  const department = departments.find((d) => d.id === departmentId) ?? null
  const users = company?.users.filter((u) => u.departmentId === departmentId) ?? []
  const editingDept = departments.find((d) => d.id === editingDeptId)
  const editingUser = users.find((u) => u.id === editingUserId)

  const selectCompany = (id: string) => {
    setCompanyId(id)
    setDepartmentId(null)
    setEditingDeptId(null)
    setEditingUserId(null)
  }
  const selectDepartment = (id: string) => {
    setDepartmentId(id)
    setEditingUserId(null)
  }

  const addCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    await api('/api/companies', 'POST', {
      name: String(fd.get('name')),
      ceoName: String(fd.get('ceo') || '') || undefined
    })
    form.reset()
  }

  const removeCompany = async (id: string) => {
    await api(`/api/companies/${id}`, 'DELETE')
    if (companyId === id) {
      setCompanyId(null)
      setDepartmentId(null)
    }
  }

  const addDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return
    const form = e.currentTarget
    const fd = new FormData(form)
    await api('/api/departments', 'POST', {
      companyId,
      name: String(fd.get('name'))
    })
    form.reset()
  }

  const saveDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingDeptId) return
    const form = e.currentTarget
    const fd = new FormData(form)
    await api(`/api/departments/${editingDeptId}`, 'PATCH', { name: String(fd.get('name')) })
    setEditingDeptId(null)
  }

  const removeDepartment = async (id: string) => {
    await api(`/api/departments/${id}`, 'DELETE')
    if (departmentId === id) {
      setDepartmentId(null)
      setEditingUserId(null)
    }
  }

  const addUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!departmentId) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const password = String(fd.get('password') || '')
    await api('/api/users', 'POST', {
      departmentId,
      name: String(fd.get('name')),
      email: String(fd.get('email')),
      password: password || undefined,
      role: String(fd.get('role') || 'EMPLOYEE')
    })
    form.reset()
  }

  const saveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUserId) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const password = String(fd.get('password') || '')
    await api(`/api/users/${editingUserId}`, 'PATCH', {
      name: String(fd.get('name')),
      email: String(fd.get('email')),
      role: String(fd.get('role') || 'EMPLOYEE'),
      password: password || undefined
    })
    setEditingUserId(null)
  }

  const toggleUserActive = async (u: UserRow) => {
    try {
      if (u.isActive) {
        await api(`/api/users/${u.id}`, 'DELETE')
        setSuccess(t('org.userDeactivated'))
      } else {
        await api(`/api/users/${u.id}`, 'PATCH', { isActive: true })
        setSuccess(t('org.userReactivated'))
      }
    } catch {
      // The exact reason is surfaced through setError() inside api().
    }
  }

  return (
    <div>
      <PageHeader
        title={t('org.title')}
        description={t('org.description')}
      />
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title={t('org.companies')} subtitle={t('org.level1')} />
            <div className="p-4">
              <form onSubmit={addCompany} className="mb-4 space-y-2">
                <Input name="name" placeholder={t('org.companyNamePlaceholder')} required />
                <Input name="ceo" placeholder={t('org.ceoPlaceholder')} />
                <Button type="submit" size="sm" className="w-full">
                  {t('org.addCompany')}
                </Button>
              </form>
              <div className="space-y-1">
                {companies.length === 0 && (
                  <EmptyState title={t('org.noCompanies')} description={t('org.noCompaniesDescription')} />
                )}
                {companies.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                      companyId === c.id
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectCompany(c.id)}
                      className="min-w-0 flex-1 text-start"
                    >
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {c.name}
                      </span>
                      <span className="block truncate text-xs text-gray-500">{c.ceoName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCompany(c.id)}
                      className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                    >
                      {t('common.remove')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader
              title={t('org.departments')}
              subtitle={company ? company.name : t('org.level2')}
            />
            <div className="p-4">
              {!company ? (
                <EmptyState
                  title={t('org.selectCompany')}
                  description={t('org.selectCompanyDescription')}
                />
              ) : (
                <>
                  <form onSubmit={addDepartment} className="mb-4 space-y-2">
                    <Input name="name" placeholder={t('org.departmentNamePlaceholder')} required />
                    <Button type="submit" size="sm" className="w-full">
                      {t('org.addDepartment')}
                    </Button>
                  </form>
                  {editingDept && (
                    <form
                      onSubmit={saveDepartment}
                      className="mb-4 space-y-2 rounded-lg border border-brand-200 bg-brand-50 p-3"
                    >
                      <Input name="name" defaultValue={editingDept.name} required />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          {t('common.save')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingDeptId(null)}
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </form>
                  )}
                  <div className="space-y-1">
                    {departments.length === 0 && <EmptyState title={t('org.noDepartments')} />}
                    {departments.map((d) => (
                      <div
                        key={d.id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                          departmentId === d.id
                            ? 'border-brand-300 bg-brand-50'
                            : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => selectDepartment(d.id)}
                          className="min-w-0 flex-1 text-start"
                        >
                          <span className="block truncate text-sm font-medium text-gray-900">
                            {d.name}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDeptId(d.id)}
                          className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDepartment(d.id)}
                          className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                        >
                          {t('common.remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader
              title={t('org.users')}
              subtitle={department ? department.name : t('org.level3')}
            />
            <div className="p-4">
              {!department ? (
                <EmptyState
                  title={t('org.selectDepartment')}
                  description={t('org.selectDepartmentDescription')}
                />
              ) : (
                <>
                  <form onSubmit={addUser} className="mb-4 space-y-2">
                    <Input name="name" placeholder={t('org.fullName')} required />
                    <Input name="email" type="email" placeholder={t('common.email')} required />
                    <Input
                      name="password"
                      type="password"
                      placeholder={t('org.passwordHint')}
                    />
                    <Select name="role" defaultValue="EMPLOYEE">
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" size="sm" className="w-full">
                      {t('org.addUser')}
                    </Button>
                  </form>
                  {editingUser && (
                    <form
                      onSubmit={saveUser}
                      className="mb-4 space-y-2 rounded-lg border border-brand-200 bg-brand-50 p-3"
                    >
                      <Input name="name" defaultValue={editingUser.name} required />
                      <Input name="email" type="email" defaultValue={editingUser.email} required />
                      <Input
                        name="password"
                        type="password"
                        placeholder={t('org.newPassword')}
                      />
                      <Select name="role" defaultValue={editingUser.role}>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Select>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          {t('common.save')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUserId(null)}
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </form>
                  )}
                  <div className="space-y-1">
                    {users.length === 0 && <EmptyState title={t('org.noUsers')} />}
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
                          u.isActive
                            ? 'border-transparent hover:bg-slate-50'
                            : 'border-slate-200 bg-slate-50/70'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-medium ${
                              u.isActive ? 'text-gray-900' : 'text-gray-400 line-through'
                            }`}
                          >
                            {u.name}
                          </span>
                          <span
                            className={`block truncate text-xs ${
                              u.isActive ? 'text-gray-500' : 'text-gray-400'
                            }`}
                          >
                            {u.email}
                          </span>
                          <span className="mt-0.5 inline-flex flex-wrap items-center gap-1.5">
                            <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                              {u.role}
                            </span>
                            {!u.isActive && (
                              <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-inset ring-red-200">
                                {t('org.deactivated')}
                              </span>
                            )}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingUserId(u.id)}
                          className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleUserActive(u)}
                          className={`shrink-0 text-xs font-medium hover:underline ${
                            u.isActive ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {u.isActive ? t('org.deactivate') : t('org.reactivate')}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}