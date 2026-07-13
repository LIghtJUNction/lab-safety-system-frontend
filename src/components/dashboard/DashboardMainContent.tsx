import type { Dispatch, SetStateAction } from "react";
import {
  CalendarClock,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import {
  api,
  type AuthMethods,
  type AuthSession,
  type DashboardStats,
  type HazardAnalytics,
  type Lab,
  type LoginCarouselSettings,
  type SafetyHazard,
  type Training,
} from "../../api";
import type { AlertItem } from "./AlertFeed";
import type { SensorReading } from "../../hooks/useTelemetry";
import type { TableRow } from "../../lib/types";
import { value, optionalValue } from "../../lib/formValues";
import { ActionForm } from "../ui/ActionForm";
import { FormInput, FormSelect } from "../ui/FormField";
import { DataTable } from "../ui/DataTable";
import { MetricCard } from "../ui/MetricCard";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { InvitationsManager } from "./InvitationsManager";
import { LoginBannerNotice } from "./LoginBannerNotice";
import { LoginCarouselEditor } from "./LoginCarouselEditor";
import { LabMembersManager } from "./LabMembersManager";
import { OverviewDashboard } from "./OverviewDashboard";
import { TrainingHighlight } from "../workspace/TrainingHighlight";
import { SystemSettingsPanel } from "./SystemSettingsPanel";

type DashboardMainContentProps = {
  showLabManagement: boolean;
  showSystemConfig: boolean;
  showOverview: boolean;
  showSystemOverview: boolean;
  showInvitations: boolean;
  showAnalytics: boolean;
  showTrainings: boolean;
  showRegulations: boolean;
  showIncidents: boolean;
  showHazards: boolean;
  showEquipment: boolean;
  showRepairs: boolean;
  showUsers: boolean;
  isSystemAdmin: boolean;
  isSystemRoute: boolean;
  isAdmin: boolean;
  canOperateLab: boolean;
  language: "zh" | "en";
  selectedLabId: number | null;
  labs: Lab[];
  setLabs: Dispatch<SetStateAction<Lab[]>>;
  session: AuthSession;
  stats: DashboardStats | null;
  hazards: SafetyHazard[];
  trainings: Training[];
  safetyDays: number;
  onlineCount: number;
  alertCount: number;
  sensors: SensorReading[];
  alertItems: AlertItem[];
  incidentBars: { name: string; count: number }[];
  hazardAnalytics: HazardAnalytics;
  regulationBars: { name: string; count: number }[];
  regulationRows: TableRow[];
  incidentRows: TableRow[];
  hazardRows: TableRow[];
  trainingRows: TableRow[];
  equipmentRows: TableRow[];
  bookingRows: TableRow[];
  repairRows: TableRow[];
  userRows: TableRow[];
  labRows: TableRow[];
  showLoginBanner: boolean;
  setShowLoginBanner: (show: boolean) => void;
  loginCarousel: LoginCarouselSettings | null;
  carouselSaving: boolean;
  syncLanguages: (from: "zh" | "en", to: "zh" | "en") => void;
  resetToDefault: () => void;
  saveLoginCarousel: (settings: LoginCarouselSettings) => Promise<void>;
  cloneSlide: (
    slide?: Partial<LoginCarouselSettings["zh"][number]>,
  ) => LoginCarouselSettings["zh"][number];
  addCarouselSlide: (language: "zh" | "en") => void;
  removeCarouselSlide: (language: "zh" | "en", index: number) => void;
  updateCarouselSlide: (
    language: "zh" | "en",
    index: number,
    patch: Partial<LoginCarouselSettings["zh"][number]>,
  ) => void;
  setNotice: (message: string) => void;
  setActive: (label: string) => void;
  onNavigate: (href: string) => void;
  submitAction: (
    label: string,
    action: () => Promise<unknown>,
  ) => Promise<void>;
  withAction: (label: string, action: () => Promise<unknown>) => Promise<void>;
  exportAnalytics: () => void;
  onAuthMethodsChange: (methods: AuthMethods) => void;
};

export function DashboardMainContent({
  showLabManagement,
  showSystemConfig,
  showOverview,
  showSystemOverview,
  showInvitations,
  showAnalytics,
  showTrainings,
  showRegulations,
  showIncidents,
  showHazards,
  showEquipment,
  showRepairs,
  showUsers,
  isSystemAdmin,
  isSystemRoute,
  isAdmin,
  canOperateLab,
  language,
  selectedLabId,
  labs,
  setLabs,
  session,
  stats,
  hazards,
  trainings,
  safetyDays,
  onlineCount,
  alertCount,
  sensors,
  alertItems,
  incidentBars,
  hazardAnalytics,
  regulationBars,
  regulationRows,
  incidentRows,
  hazardRows,
  trainingRows,
  equipmentRows,
  bookingRows,
  repairRows,
  userRows,
  labRows,
  showLoginBanner,
  setShowLoginBanner,
  loginCarousel,
  carouselSaving,
  syncLanguages,
  resetToDefault,
  saveLoginCarousel,
  cloneSlide,
  addCarouselSlide,
  removeCarouselSlide,
  updateCarouselSlide,
  setNotice,
  setActive,
  onNavigate,
  submitAction,
  withAction,
  exportAnalytics,
  onAuthMethodsChange,
}: DashboardMainContentProps) {
  return (
    <>
      {showLabManagement && isSystemAdmin && (
        <div className="mb-4 p-4 border border-stone-200 rounded-xl bg-white/50 dark:bg-stone-900/30">
          <h4 className="font-medium mb-2">
            {language === "en" ? "Create lab" : "新建实验室"}
          </h4>
          <ActionForm
            title=""
            onSubmit={(form) =>
              submitAction(
                language === "en" ? "Create lab" : "创建实验室",
                async () => {
                  const newLab = await api.createLab({
                    code: value(form, "code"),
                    name: value(form, "name"),
                    location: optionalValue(form, "location"),
                    department: optionalValue(form, "department"),
                    contact: optionalValue(form, "contact"),
                    status: value(form, "status"),
                    description: optionalValue(form, "description"),
                    manager_user_id: null,
                  });
                  setLabs((prev) => [...prev, newLab]);
                  return newLab;
                },
              )
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <FormInput
                name="code"
                placeholder={
                  language === "en" ? "Code LAB-XXX" : "代码 LAB-XXX"
                }
              />
              <FormInput
                name="name"
                placeholder={language === "en" ? "Name" : "名称"}
              />
              <FormInput
                name="location"
                placeholder={language === "en" ? "Location" : "地点"}
              />
              <FormInput
                name="department"
                placeholder={language === "en" ? "Department" : "院系"}
              />
              <FormInput
                name="contact"
                placeholder={language === "en" ? "Contact" : "联系"}
              />
              <FormSelect name="status" defaultValue="active">
                <option value="active">
                  {language === "en" ? "Active" : "启用"}
                </option>
                <option value="inactive">
                  {language === "en" ? "Inactive" : "停用"}
                </option>
                <option value="maintenance">
                  {language === "en" ? "Maintenance" : "维护中"}
                </option>
              </FormSelect>
            </div>
            <textarea
              name="description"
              placeholder={language === "en" ? "Description" : "描述"}
              className="col-span-1 md:col-span-2 rounded-xl border border-stone-300 bg-transparent px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-stone-700"
              rows={3}
            />
          </ActionForm>
        </div>
      )}

      {showOverview ? (
        <div className="mt-8">
          <OverviewDashboard
            safetyDays={safetyDays}
            onlineCount={onlineCount}
            alertCount={alertCount}
            sensors={sensors}
            alerts={alertItems}
            canOperateLab={canOperateLab}
            canCloseHazards={isAdmin}
            language={language}
            onAssign={(hazard) =>
              void withAction(
                language === "en" ? "Assign handler" : "指派处理",
                () => api.claimHazard(hazard.id, session.user.id),
              ).catch(() => undefined)
            }
            onConfirm={(hazard) => {
              if (!isAdmin) return;
              void withAction(language === "en" ? "Confirm safe" : "确认安全", () =>
                api.updateHazardStatus(hazard.id, "closed"),
              ).catch(() => undefined);
            }}
            onReport={() => {
              setActive("隐患管理");
              document
                .querySelector('[data-action="hazard-report"]')
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            onEquipment={() => setActive("设备预约")}
            onTraining={() => setActive("培训考核")}
          />
        </div>
      ) : null}

      {showInvitations ? (
        <div className="mt-8">
          <InvitationsManager
            labId={isSystemRoute ? null : selectedLabId}
            isSystemAdmin={isSystemAdmin}
            labs={labs}
            language={language}
          />
        </div>
      ) : null}

      {showOverview || showSystemOverview ? (
        <section className="metrics mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={language === "en" ? "Regulations" : "法规条例"}
            value={`${stats?.regulation_count ?? 0}`}
            hint={
              language === "en"
                ? "Upload, search, and classify records"
                : "支持上传、查询和分类管理"
            }
            icon={ClipboardList}
          />
          <MetricCard
            label={language === "en" ? "Training pass rate" : "培训通过率"}
            value={`${Math.round((stats?.exam_pass_rate ?? 0) * 100)}%`}
            hint={
              language === "en"
                ? `${stats?.training_count ?? 0} training programs`
                : `${stats?.training_count ?? 0} 个培训项目`
            }
            icon={GraduationCap}
          />
          <MetricCard
            label={language === "en" ? "Equipment count" : "设备数量"}
            value={`${stats?.equipment_count ?? 0}`}
            hint={
              language === "en"
                ? "Search, booking, and repair workflows"
                : "支持查询、预约和报修"
            }
            icon={CalendarClock}
          />
          <MetricCard
            label={
              language === "en"
                ? isAdmin
                  ? "Hazard closure"
                  : "My hazards"
                : isAdmin
                  ? "隐患闭环"
                  : "我的隐患"
            }
            value={`${hazards.length}`}
            hint={
              language === "en"
                ? isAdmin
                  ? "Issue photos, claiming, and remediation photos"
                  : "Reporting and remediation tasks"
                : isAdmin
                  ? "问题照片、认领、整改照片"
                  : "上报和整改任务"
            }
            icon={ShieldCheck}
            accent={
              hazards.some((h) => h.status !== "closed") ? "amber" : "primary"
            }
          />
        </section>
      ) : null}

      {isSystemAdmin && (
        <LoginBannerNotice
          expanded={showLoginBanner}
          language={language}
          onToggle={() => setShowLoginBanner(!showLoginBanner)}
          onOpenConfig={() => setActive("全局配置")}
          onReset={resetToDefault}
        />
      )}

      <section className="content-grid mt-8 grid gap-6 lg:grid-cols-2">
        {showAnalytics ? (
          <AnalyticsPanel
            title={
              language === "en"
                ? isAdmin
                  ? "Incident analysis"
                  : "My hazard status"
                : isAdmin
                  ? "事故案例分析"
                  : "我的隐患状态"
            }
            items={isAdmin ? incidentBars : hazardAnalytics.by_status}
            onExport={exportAnalytics}
            language={language}
          />
        ) : null}

        {showAnalytics && isAdmin ? (
          <AnalyticsPanel
            title={language === "en" ? "Hazard status analysis" : "隐患状态分析"}
            items={hazardAnalytics.by_status}
            onExport={exportAnalytics}
            language={language}
          />
        ) : null}

        {showAnalytics && isAdmin ? (
          <AnalyticsPanel
            title={language === "en" ? "Hazard category analysis" : "隐患分类分析"}
            items={hazardAnalytics.by_category}
            onExport={exportAnalytics}
            language={language}
          />
        ) : null}

        {showAnalytics && isAdmin && regulationBars.length > 0 ? (
          <AnalyticsPanel
            title={language === "en" ? "Regulation statistics" : "法规统计"}
            items={regulationBars}
            onExport={exportAnalytics}
            language={language}
          />
        ) : null}

        {showTrainings ? (
          <TrainingHighlight
            stats={stats}
            isAdmin={isAdmin}
            onCreate={() =>
              document
                .querySelector('[data-action="training"]')
                ?.scrollIntoView({ behavior: "smooth" })
            }
            onRegister={() =>
              document
                .querySelector('[data-action="exam-result"]')
                ?.scrollIntoView({ behavior: "smooth" })
            }
            language={language}
          />
        ) : null}

        {showRegulations ? (
          <DataTable
            title={language === "en" ? "Regulation uploads" : "法规条例上传"}
            rows={regulationRows}
            onViewAll={() => setActive("法规条例")}
            onNavigate={onNavigate}
          />
        ) : null}
        {showIncidents ? (
          <DataTable
            title={language === "en" ? "Incident case library" : "事故案例库"}
            rows={incidentRows}
            onViewAll={() => setActive("事故案例")}
            onNavigate={onNavigate}
          />
        ) : null}
        {showHazards ? (
          <DataTable
            title={
              language === "en"
                ? isAdmin
                  ? "Hazard closure"
                  : "My hazards"
                : isAdmin
                  ? "安全隐患闭环"
                  : "我的安全隐患"
            }
            rows={hazardRows}
            onViewAll={() => setActive("隐患管理")}
            onNavigate={onNavigate}
          />
        ) : null}
        {showTrainings ? (
          <DataTable
            title={language === "en" ? "Training programs" : "培训项目"}
            rows={trainingRows}
            onViewAll={() => setActive("培训考核")}
          />
        ) : null}
        {showEquipment ? (
          <DataTable
            title={language === "en" ? "Equipment ledger" : "设备台账"}
            rows={equipmentRows}
            onViewAll={() => setActive("设备预约")}
          />
        ) : null}
        {showEquipment ? (
          <DataTable
            title={
              language === "en" ? "Equipment booking schedule" : "设备预约排程"
            }
            rows={bookingRows}
            onViewAll={() => setActive("设备预约")}
          />
        ) : null}
        {isAdmin && showRepairs ? (
          <DataTable
            title={language === "en" ? "Repair tickets" : "报修工单"}
            rows={repairRows}
            onViewAll={() => setActive("报修工单")}
          />
        ) : null}
        {isAdmin && showUsers ? (
          <DataTable
            title={
              language === "en" ? "Users and login methods" : "用户与登录方式"
            }
            rows={userRows}
            onViewAll={() => setActive("用户管理")}
          />
        ) : null}
      </section>

      {/* Lab management for system admin */}
      {showLabManagement && isSystemAdmin && (
        <section className="mt-6 space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white/80 p-5 dark:border-stone-700 dark:bg-stone-900/60">
            <h3 className="mb-4 text-base font-semibold">
              {language === "en" ? "Lab list" : "实验室列表"}
            </h3>
            <DataTable
              title={language === "en" ? "Lab list" : "实验室列表"}
              rows={labRows}
            />
          </div>
          <LabMembersManager labs={labs} language={language} />
        </section>
      )}

      {showSystemConfig && isSystemAdmin ? (
        <div className="space-y-6">
          <SystemSettingsPanel language={language} onAuthMethodsChange={onAuthMethodsChange} />
          <LoginCarouselEditor
            loginCarousel={loginCarousel}
            carouselSaving={carouselSaving}
            language={language}
            syncLanguages={syncLanguages}
            resetToDefault={resetToDefault}
            saveLoginCarousel={saveLoginCarousel}
            cloneSlide={cloneSlide}
            addCarouselSlide={addCarouselSlide}
            removeCarouselSlide={removeCarouselSlide}
            updateCarouselSlide={updateCarouselSlide}
          />
        </div>
      ) : null}
    </>
  );
}
