import { render, screen } from '@testing-library/react'
import RequestPrintLayout from '@/components/print/RequestPrintLayout'

describe('RequestPrintLayout', () => {
  const baseProps = {
    companyName: 'Hatwan Company',
    departmentName: 'Information Technology',
    requesterName: 'Zana Karim',
    itemName: 'Dell Latitude 7450 Laptop',
    explanation: 'Replacement laptop for development work.',
    rating: 8
  }

  it('renders a right-to-left Kurdish document', () => {
    render(<RequestPrintLayout {...baseProps} />)
    const sheet = document.getElementById('print-section')
    expect(sheet).toHaveAttribute('dir', 'rtl')
    expect(sheet).toHaveAttribute('lang', 'ckb')
  })

  it('renders company name as the level-1 heading', () => {
    render(<RequestPrintLayout {...baseProps} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hatwan Company')
  })

  it('displays department and requester names', () => {
    render(<RequestPrintLayout {...baseProps} />)
    expect(screen.getAllByText('Information Technology').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Zana Karim').length).toBeGreaterThan(0)
  })

  it('displays the item name', () => {
    render(<RequestPrintLayout {...baseProps} />)
    expect(screen.getAllByText('Dell Latitude 7450 Laptop').length).toBeGreaterThan(0)
  })

  it('shows the explanation text', () => {
    render(<RequestPrintLayout {...baseProps} />)
    expect(
      screen.getAllByText('Replacement laptop for development work.').length
    ).toBeGreaterThan(0)
  })

  it('displays the Kurdish necessity rating', () => {
    render(<RequestPrintLayout {...baseProps} />)
    expect(screen.getByText('٨ / ١٠')).toBeInTheDocument()
  })

  it('renders 10 rating meter segments', () => {
    render(<RequestPrintLayout {...baseProps} />)
    const meter = screen.getByTestId('rating-meter')
    expect(meter.querySelectorAll('span')).toHaveLength(10)
  })

  it('shows approved status in Kurdish', () => {
    render(
      <RequestPrintLayout
        {...baseProps}
        approvalStatus="APPROVED"
        reviewDate="2024-03-15T12:00:00Z"
      />
    )
    expect(screen.getByText('پەسەندکراو')).toBeInTheDocument()
    expect(screen.getAllByText(/١٥\/٠٣\/٢٠٢٤/).length).toBeGreaterThan(0)
  })

  it('shows rejected status in Kurdish', () => {
    render(<RequestPrintLayout {...baseProps} approvalStatus="REJECTED" />)
    expect(screen.getByText('ڕەتکراوە')).toBeInTheDocument()
  })

  it('does not render a decision row when no status is given', () => {
    render(<RequestPrintLayout {...baseProps} />)
    expect(screen.queryByText('پەسەندکراو')).not.toBeInTheDocument()
    expect(screen.queryByText('ڕەتکراوە')).not.toBeInTheDocument()
  })

  it('renders the CEO name and Kurdish signature title', () => {
    render(<RequestPrintLayout {...baseProps} />)
    expect(screen.getByText('Mohammed Ahmed Ali')).toBeInTheDocument()
    expect(screen.getByText('واژووی کۆتایی / بەڕێوەبەری گشتی')).toBeInTheDocument()
  })

  it('formats the request date with Kurdish numerals', () => {
    render(<RequestPrintLayout {...baseProps} requestDate="2024-05-01T12:00:00Z" />)
    expect(screen.getAllByText('٠١/٠٥/٢٠٢٤').length).toBeGreaterThan(0)
  })

  it('uses a blank line for a missing request date', () => {
    render(<RequestPrintLayout {...baseProps} />)
    expect(screen.getAllByText('__________').length).toBeGreaterThan(0)
  })

  it('formats estimated cost in Iraqi Dinar with Kurdish numerals', () => {
    render(<RequestPrintLayout {...baseProps} estimatedCost={1234.5} />)
    expect(screen.getByText('١٬٢٣٥ د.ع')).toBeInTheDocument()
  })

  it('does not leak English UI labels', () => {
    render(<RequestPrintLayout {...baseProps} approvalStatus="APPROVED" />)
    const sheet = document.getElementById('print-section')
    const text = sheet?.textContent ?? ''
    for (const english of [
      'Department',
      'Requester',
      'Request Date',
      'Necessity Rating',
      'Decision',
      'Official Approval',
      'Chief Executive Officer',
      'CEO Signature'
    ]) {
      expect(text).not.toContain(english)
    }
  })
})
