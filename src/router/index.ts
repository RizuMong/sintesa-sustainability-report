import { createRouter, createWebHistory } from 'vue-router'
import EvaluateRequestorPage from '@/pages/evaluate-gri-quantitative/RequestorPage.vue'
import EvaluateApprovalPage from '@/pages/evaluate-gri-quantitative/ApprovalPage.vue'
import EvaluateDetailPage from '@/pages/evaluate-gri-quantitative/DetailPage.vue'
import MasterKeyIndicatorListPage from '@/pages/master-key-indicator-quantitative/ListPage.vue'
import MasterKeyIndicatorDetailPage from '@/pages/master-key-indicator-quantitative/DetailPage.vue'
import DashboardGriQuantitativePage from '@/pages/dashboard/GriQuantitativePage.vue'
import DashboardGriQualitativePage from '@/pages/dashboard/GriQualitativePage.vue'
import DashboardSdgPage from '@/pages/dashboard/SdgPage.vue'
import DataExportListPage from '@/pages/data-export/ListPage.vue'
import UserProfilePage from '@/pages/user-profile/ProfilePage.vue'

// flat routes, no shared layout wrapper — each page standalone so it can be embedded in another app by route alone
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard/gri-quantitative' },
    { path: '/evaluate-gri-quantitative/requestor', name: 'evaluate-requestor', component: EvaluateRequestorPage },
    { path: '/evaluate-gri-quantitative/approval', name: 'evaluate-approval', component: EvaluateApprovalPage },
    // alias — same 3-tab Review & Approval shell (FSD 2.4), reachable at its own top-level path too
    { path: '/review-approval', name: 'review-approval', component: EvaluateApprovalPage },
    {
      path: '/evaluate-gri-quantitative/detail',
      name: 'evaluate-detail',
      component: EvaluateDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/master-key-indicator-quantitative', name: 'mki-list', component: MasterKeyIndicatorListPage },
    {
      path: '/master-key-indicator-quantitative/detail',
      name: 'mki-detail',
      component: MasterKeyIndicatorDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/dashboard/gri-quantitative', name: 'dashboard-gri-quantitative', component: DashboardGriQuantitativePage },
    { path: '/dashboard/gri-qualitative', name: 'dashboard-gri-qualitative', component: DashboardGriQualitativePage },
    { path: '/dashboard/sdg', name: 'dashboard-sdg', component: DashboardSdgPage },
    { path: '/data-export', name: 'data-export', component: DataExportListPage },
    { path: '/user-profile', name: 'user-profile', component: UserProfilePage },
  ],
})
