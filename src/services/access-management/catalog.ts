// Static App/Page catalog seeded verbatim from FSD `docs/fsd/INTRODUCTION.md` §3.2's
// Module → Menu → Sub-Menu table. No CRUD over this catalog — only the Position→Page
// grant matrix (AccessGrant) is persisted. No `@` alias imports here on purpose so
// `api.check.ts` can run under plain node.

export const ACCESS_MANAGEMENT_APPS = ['Platform Administrator', 'Sustainability Reporting'] as const

type Row = { app: (typeof ACCESS_MANAGEMENT_APPS)[number]; menu: string; subMenu: string | null }

const ROWS: Row[] = [
  // Platform Administrator
  { app: 'Platform Administrator', menu: 'Master Data', subMenu: 'Master Unit' },
  { app: 'Platform Administrator', menu: 'Master Data', subMenu: 'Master Entity' },
  { app: 'Platform Administrator', menu: 'Master Data', subMenu: 'Master Pillar' },
  { app: 'Platform Administrator', menu: 'Master Data', subMenu: 'Master Period' },
  { app: 'Platform Administrator', menu: 'Master Data', subMenu: 'Global Reporting Initiative (GRI)' },
  { app: 'Platform Administrator', menu: 'User Management', subMenu: 'Position' },
  { app: 'Platform Administrator', menu: 'User Management', subMenu: 'Employee' },
  { app: 'Platform Administrator', menu: 'User Management', subMenu: 'Access Management' },
  { app: 'Platform Administrator', menu: 'Master Key Indicator', subMenu: 'GRI - Qualitative' },
  { app: 'Platform Administrator', menu: 'Master Key Indicator', subMenu: 'GRI - Quantitative' },
  { app: 'Platform Administrator', menu: 'Master Key Indicator', subMenu: 'SDG' },
  { app: 'Platform Administrator', menu: 'Periodic Notification', subMenu: null },
  { app: 'Platform Administrator', menu: 'Workflow Configuration', subMenu: null },
  { app: 'Platform Administrator', menu: 'Generate Action Plan', subMenu: null },
  // Sustainability Reporting
  { app: 'Sustainability Reporting', menu: 'Global Reporting Initiative', subMenu: 'Qualitative' },
  { app: 'Sustainability Reporting', menu: 'Global Reporting Initiative', subMenu: 'Quantitative' },
  { app: 'Sustainability Reporting', menu: 'Sustainability Development Goals', subMenu: 'SDG Adoption Management' },
  { app: 'Sustainability Reporting', menu: 'Sustainability Development Goals', subMenu: 'SDG Framework' },
  { app: 'Sustainability Reporting', menu: 'Evaluate GRI - Qualitative', subMenu: 'Approval' },
  { app: 'Sustainability Reporting', menu: 'Evaluate GRI - Quantitative', subMenu: 'Approval' },
  { app: 'Sustainability Reporting', menu: 'Report Plan Realization', subMenu: 'Approval' },
  { app: 'Sustainability Reporting', menu: 'Initiated Action Plan', subMenu: 'Approval' },
  { app: 'Sustainability Reporting', menu: 'Action Plan Change Request', subMenu: 'Approval' },
  { app: 'Sustainability Reporting', menu: 'Performance Tracking', subMenu: 'GRI - Qualitative Submission Tracker' },
  { app: 'Sustainability Reporting', menu: 'Performance Tracking', subMenu: 'GRI - Quantitative Submission Tracker' },
  { app: 'Sustainability Reporting', menu: 'Performance Tracking', subMenu: 'Action Plan Tracker' },
  { app: 'Sustainability Reporting', menu: 'Performance Tracking', subMenu: 'Initiate New Plan Tracker' },
  { app: 'Sustainability Reporting', menu: 'Performance Tracking', subMenu: 'Realization Tracker' },
  { app: 'Sustainability Reporting', menu: 'Strategic Insights', subMenu: null },
  { app: 'Sustainability Reporting', menu: 'Data Export & Report', subMenu: 'GRI - Qualitative Consolidation' },
  { app: 'Sustainability Reporting', menu: 'Data Export & Report', subMenu: 'GRI - Quantitative Consolidation' },
  { app: 'Sustainability Reporting', menu: 'Data Export & Report', subMenu: 'SDG Consolidation' },
  { app: 'Sustainability Reporting', menu: 'GRI - Qualitative', subMenu: 'Submission' },
  { app: 'Sustainability Reporting', menu: 'GRI - Quantitative', subMenu: 'Submission' },
  { app: 'Sustainability Reporting', menu: 'Submit Action Plan', subMenu: null },
  { app: 'Sustainability Reporting', menu: 'Initiate New Plan', subMenu: 'Submission' },
  { app: 'Sustainability Reporting', menu: 'Action Plan Change Request', subMenu: 'Submission' },
  { app: 'Sustainability Reporting', menu: 'Report Plan Realization', subMenu: 'Submission' },
]

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildAccessManagementCatalog(): AccessManagementPage[] {
  return ROWS.map((row) => {
    const label = row.subMenu ? `${row.menu} - ${row.subMenu}` : row.menu
    return {
      id: `${slugify(row.app)}__${slugify(label)}`,
      app: row.app,
      menu: row.menu,
      subMenu: row.subMenu,
      label,
    }
  })
}
