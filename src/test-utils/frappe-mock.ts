export interface FrappeMock {
  xcall: ReturnType<typeof vi.fn>
  db: {
    get_value: ReturnType<typeof vi.fn>
    get_list: ReturnType<typeof vi.fn>
  }
  call: ReturnType<typeof vi.fn>
  show_alert: ReturnType<typeof vi.fn>
}

export function createFrappeMock(overrides: Partial<FrappeMock> = {}): FrappeMock {
  return {
    xcall: vi.fn().mockResolvedValue(null),
    db: {
      get_value: vi.fn().mockResolvedValue(null),
      get_list: vi.fn().mockResolvedValue([]),
    },
    call: vi.fn().mockResolvedValue(null),
    show_alert: vi.fn(),
    ...overrides,
  }
}

export function installFrappeMock(mock?: FrappeMock): FrappeMock {
  const frappe = mock ?? createFrappeMock()
  window.frappe = frappe as unknown as Record<string, unknown>
  return frappe
}

export function uninstallFrappeMock() {
  delete window.frappe
}
