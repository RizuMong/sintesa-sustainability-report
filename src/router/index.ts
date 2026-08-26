import { createRouter, createWebHistory } from 'vue-router'
import GriQuantitativePage from '@/pages/gri-quantitative/ListPage.vue'
import GriQuantitativeDetailPage from '@/pages/gri-quantitative/DetailPage.vue'
import EvaluateRequestorPage from '@/pages/evaluate-gri-quantitative/RequestorPage.vue'
import EvaluateApprovalPage from '@/pages/evaluate-gri-quantitative/ApprovalPage.vue'
import EvaluateDetailPage from '@/pages/evaluate-gri-quantitative/DetailPage.vue'
import MasterKeyIndicatorListPage from '@/pages/master-key-indicator-quantitative/ListPage.vue'
import MasterKeyIndicatorDetailPage from '@/pages/master-key-indicator-quantitative/DetailPage.vue'
import DashboardGriQuantitativePage from '@/pages/dashboard/GriQuantitativePage.vue'
import DashboardGriQualitativePage from '@/pages/dashboard/GriQualitativePage.vue'
import DashboardSdgPage from '@/pages/dashboard/SdgPage.vue'
import MasterUnitListPage from '@/pages/master-unit/ListPage.vue'
import MasterUnitDetailPage from '@/pages/master-unit/DetailPage.vue'
import MasterPillarListPage from '@/pages/master-pillar/ListPage.vue'
import MasterPillarDetailPage from '@/pages/master-pillar/DetailPage.vue'
import MasterPeriodListPage from '@/pages/master-period/ListPage.vue'
import MasterPeriodDetailPage from '@/pages/master-period/DetailPage.vue'
import MasterGriListPage from '@/pages/master-gri/ListPage.vue'
import MasterGriDetailPage from '@/pages/master-gri/DetailPage.vue'
import MasterEntityListPage from '@/pages/master-entity/ListPage.vue'
import MasterEntityDetailPage from '@/pages/master-entity/DetailPage.vue'
import MasterPositionListPage from '@/pages/master-position/ListPage.vue'
import MasterPositionDetailPage from '@/pages/master-position/DetailPage.vue'
import MasterEmployeeListPage from '@/pages/master-employee/ListPage.vue'
import MasterEmployeeDetailPage from '@/pages/master-employee/DetailPage.vue'
import AccessManagementIndexPage from '@/pages/access-management/IndexPage.vue'
import MkiGriQualitativeListPage from '@/pages/mki-gri-qualitative/ListPage.vue'
import MkiGriQualitativeDetailPage from '@/pages/mki-gri-qualitative/DetailPage.vue'
import MkiSdgListPage from '@/pages/mki-sdg/ListPage.vue'
import MkiSdgDetailPage from '@/pages/mki-sdg/DetailPage.vue'
import WorkflowConfigurationListPage from '@/pages/workflow-configuration/ListPage.vue'
import WorkflowConfigurationDetailPage from '@/pages/workflow-configuration/DetailPage.vue'
import PeriodicNotificationListPage from '@/pages/periodic-notification/ListPage.vue'
import PeriodicNotificationDetailPage from '@/pages/periodic-notification/DetailPage.vue'
import GenerateActionPlanLogListPage from '@/pages/generate-action-plan-log/ListPage.vue'
import SdgAdoptionListPage from '@/pages/sdg-adoption/ListPage.vue'
import SdgFrameworkListPage from '@/pages/sdg-framework/ListPage.vue'
import SdgFrameworkDetailPage from '@/pages/sdg-framework/DetailPage.vue'
import GriQualitativeListPage from '@/pages/gri-qualitative/ListPage.vue'
import GriQualitativeDetailPage from '@/pages/gri-qualitative/DetailPage.vue'
import InitiateNewPlanListPage from '@/pages/initiate-new-plan/ListPage.vue'
import InitiateNewPlanDetailPage from '@/pages/initiate-new-plan/DetailPage.vue'
import ActionPlanChangeRequestListPage from '@/pages/action-plan-change-request/ListPage.vue'
import ActionPlanChangeRequestDetailPage from '@/pages/action-plan-change-request/DetailPage.vue'
import ActionPlanSubmissionListPage from '@/pages/action-plan-submission/ListPage.vue'
import ActionPlanSubmissionDetailPage from '@/pages/action-plan-submission/DetailPage.vue'
import ReportPlanRealizationListPage from '@/pages/report-plan-realization/ListPage.vue'
import ReportPlanRealizationDetailPage from '@/pages/report-plan-realization/DetailPage.vue'
import ActionPlanChangeRequestApprovalPage from '@/pages/action-plan-change-request/ApprovalPage.vue'
import PerformanceTrackingListPage from '@/pages/performance-tracking/ListPage.vue'
import DataExportListPage from '@/pages/data-export/ListPage.vue'

// flat routes, no shared layout wrapper — each page standalone so it can be embedded in another app by route alone
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard/gri-quantitative' },
    { path: '/gri-quantitative', name: 'gri-quantitative', component: GriQuantitativePage },
    {
      path: '/gri-quantitative/detail',
      name: 'gri-quantitative-detail',
      component: GriQuantitativeDetailPage,
      meta: { nextTheme: true },
    },
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
    { path: '/master-unit', name: 'master-unit', component: MasterUnitListPage },
    { path: '/master-unit/detail', name: 'master-unit-detail', component: MasterUnitDetailPage, meta: { nextTheme: true } },
    { path: '/master-pillar', name: 'master-pillar', component: MasterPillarListPage },
    {
      path: '/master-pillar/detail',
      name: 'master-pillar-detail',
      component: MasterPillarDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/master-period', name: 'master-period', component: MasterPeriodListPage },
    {
      path: '/master-period/detail',
      name: 'master-period-detail',
      component: MasterPeriodDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/master-gri', name: 'master-gri', component: MasterGriListPage },
    { path: '/master-gri/detail', name: 'master-gri-detail', component: MasterGriDetailPage, meta: { nextTheme: true } },
    { path: '/master-entity', name: 'master-entity', component: MasterEntityListPage },
    {
      path: '/master-entity/detail',
      name: 'master-entity-detail',
      component: MasterEntityDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/master-position', name: 'master-position', component: MasterPositionListPage },
    {
      path: '/master-position/detail',
      name: 'master-position-detail',
      component: MasterPositionDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/master-employee', name: 'master-employee', component: MasterEmployeeListPage },
    {
      path: '/master-employee/detail',
      name: 'master-employee-detail',
      component: MasterEmployeeDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/access-management', name: 'access-management', component: AccessManagementIndexPage },
    { path: '/mki-gri-qualitative', name: 'mki-gri-qualitative', component: MkiGriQualitativeListPage },
    {
      path: '/mki-gri-qualitative/detail',
      name: 'mki-gri-qualitative-detail',
      component: MkiGriQualitativeDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/mki-sdg', name: 'mki-sdg', component: MkiSdgListPage },
    {
      path: '/mki-sdg/detail',
      name: 'mki-sdg-detail',
      component: MkiSdgDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/workflow-configuration', name: 'workflow-configuration', component: WorkflowConfigurationListPage },
    {
      path: '/workflow-configuration/detail',
      name: 'workflow-configuration-detail',
      component: WorkflowConfigurationDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/periodic-notification', name: 'periodic-notification', component: PeriodicNotificationListPage },
    {
      path: '/periodic-notification/detail',
      name: 'periodic-notification-detail',
      component: PeriodicNotificationDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/generate-action-plan-log', name: 'generate-action-plan-log', component: GenerateActionPlanLogListPage },
    { path: '/sdg-adoption', name: 'sdg-adoption', component: SdgAdoptionListPage },
    { path: '/sdg-framework', name: 'sdg-framework', component: SdgFrameworkListPage },
    {
      path: '/sdg-framework/detail',
      name: 'sdg-framework-detail',
      component: SdgFrameworkDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/gri-qualitative', name: 'gri-qualitative', component: GriQualitativeListPage },
    {
      path: '/gri-qualitative/detail',
      name: 'gri-qualitative-detail',
      component: GriQualitativeDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/initiate-new-plan', name: 'initiate-new-plan', component: InitiateNewPlanListPage },
    {
      path: '/initiate-new-plan/detail',
      name: 'initiate-new-plan-detail',
      component: InitiateNewPlanDetailPage,
      meta: { nextTheme: true },
    },
    {
      path: '/action-plan-change-request',
      name: 'action-plan-change-request',
      component: ActionPlanChangeRequestListPage,
    },
    {
      path: '/action-plan-change-request/detail',
      name: 'action-plan-change-request-detail',
      component: ActionPlanChangeRequestDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/action-plan-submission', name: 'action-plan-submission', component: ActionPlanSubmissionListPage },
    {
      path: '/action-plan-submission/detail',
      name: 'action-plan-submission-detail',
      component: ActionPlanSubmissionDetailPage,
      meta: { nextTheme: true },
    },
    { path: '/report-plan-realization', name: 'report-plan-realization', component: ReportPlanRealizationListPage },
    {
      path: '/report-plan-realization/detail',
      name: 'report-plan-realization-detail',
      component: ReportPlanRealizationDetailPage,
      meta: { nextTheme: true },
    },
    {
      path: '/action-plan-change-request/approval',
      name: 'action-plan-change-request-approval',
      component: ActionPlanChangeRequestApprovalPage,
    },
    { path: '/performance-tracking', name: 'performance-tracking', component: PerformanceTrackingListPage },
    { path: '/data-export', name: 'data-export', component: DataExportListPage },
  ],
})
