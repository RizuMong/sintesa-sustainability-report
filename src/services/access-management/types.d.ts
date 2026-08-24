declare global {
  // one row of the static App/Page catalog (FSD 3.2 menu table) — no CRUD, seed data only
  interface AccessManagementPage {
    id: string
    app: 'Platform Administrator' | 'Sustainability Reporting'
    menu: string
    subMenu: string | null
    label: string // "Menu" or "Menu - SubMenu"
  }

  // one granted App/Page for a Position — the persisted matrix cell
  interface AccessGrant {
    position_id: string
    app: string
    page: string // AccessManagementPage.id
  }
}

export {}
