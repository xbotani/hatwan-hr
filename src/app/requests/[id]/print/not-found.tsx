import Link from 'next/link'

export default function PrintNotFound() {
  return (
    <div
      dir="rtl"
      lang="ckb"
      className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center print:hidden"
    >
      <h1 className="text-2xl font-bold text-gray-900">داواکاری نەدۆزرایەوە</h1>
      <p className="mt-2 text-gray-600">بەڵگەنامەی داواکاری داواکراو نەدۆزرایەوە.</p>
      <Link
        href="/requests"
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
      >
        گەڕانەوە بۆ داواکارییەکان
      </Link>
    </div>
  )
}