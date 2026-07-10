import { AlertTriangle, ClipboardList, FlaskConical, ShieldCheck, Wrench } from "lucide-react";
import { api, type AuthMethods, type AuthSession, type Equipment, type Lab, type SafetyHazard, type Training } from "../../api";
import { ActionForm } from "../ui/ActionForm";
import { FormInput, FormSelect, UploadButton } from "../ui/FormField";
import { datetimeValue, numberValue, optionalValue, userCreateValue, value } from "../../lib/formValues";
import { claimFirstHazard, remediateFirstHazard, sessionUserOrThrow, uploadHazardIssuePhotoForReport } from "../../lib/hazardActions";

type QuickActionsPanelProps = {
  isAdmin: boolean;
  showRegulations: boolean;
  showIncidents: boolean;
  showHazards: boolean;
  showTrainings: boolean;
  showEquipment: boolean;
  showRepairs: boolean;
  showUsers: boolean;
  language: "zh" | "en";
  session: AuthSession;
  authMethods: AuthMethods;
  selectedLabId: number | null;
  labs: Lab[];
  equipment: Equipment[];
  trainings: Training[];
  hazards: SafetyHazard[];
  submitAction: (label: string, action: () => Promise<unknown>) => Promise<void>;
  withAction: (label: string, action: () => Promise<unknown>) => Promise<void>;
};

export function QuickActionsPanel({
  isAdmin,
  showRegulations,
  showIncidents,
  showHazards,
  showTrainings,
  showEquipment,
  showRepairs,
  showUsers,
  language,
  session,
  authMethods,
  selectedLabId,
  labs,
  equipment,
  trainings,
  hazards,
  submitAction,
  withAction,
}: QuickActionsPanelProps) {
  const isEn = language === "en";
  const hasAnyAction =
    showRegulations ||
    showIncidents ||
    showHazards ||
    showTrainings ||
    showEquipment ||
    showRepairs ||
    showUsers;

  if (!hasAnyAction) return null;

  return (
    <section className="quick-actions-wrap space-y-4 pb-10">
      <div className="flex items-end justify-between gap-3 border-b border-stone-200/80 pb-3 dark:border-stone-800">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {isEn ? "Action desk" : "操作台"}
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {isEn
              ? "Create and update records for the current laboratory"
              : "为当前实验室创建与更新业务记录"}
          </p>
        </div>
        {selectedLabId ? (
          <span className="hidden text-[11px] font-medium text-stone-400 sm:inline dark:text-stone-500">
            lab_id={selectedLabId}
          </span>
        ) : null}
      </div>
      <div className="quick-actions grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {isAdmin && showRegulations ? (
        <ActionForm
          title={isEn ? "Create regulation" : "创建法规"}
          onSubmit={(form) =>
            submitAction(isEn ? "Create regulation" : "创建法规", () =>
              api.createRegulation({
                title: value(form, "title"),
                regulation_type: value(form, "regulation_type"),
                issuing_authority: value(form, "issuing_authority"),
                effective_date: optionalValue(form, "effective_date"),
                summary: value(form, "summary"),
                file_url: null,
              }),
            )
          }
        >
          <FormInput name="title" placeholder={isEn ? "Regulation title" : "法规标题"} />
          <FormSelect name="regulation_type" defaultValue="">
            <option value="" disabled>{isEn ? "Select regulation type" : "选择法规类型"}</option>
            <option value="law">{isEn ? "Law" : "法律"}</option>
            <option value="regulation">{isEn ? "Regulation" : "法规"}</option>
            <option value="standard">{isEn ? "Standard" : "标准"}</option>
            <option value="policy">{isEn ? "Internal policy" : "校内制度"}</option>
          </FormSelect>
          <FormInput name="issuing_authority" placeholder={isEn ? "Issuing authority" : "发布单位"} />
          <FormInput name="effective_date" type="date" />
          <FormInput name="summary" placeholder={isEn ? "Summary" : "摘要"} className="sm:col-span-2" />
        </ActionForm>
      ) : null}

      {isAdmin && showIncidents ? (
        <ActionForm
          title={isEn ? "Record incident case" : "录入事故案例"}
          onSubmit={(form) =>
            submitAction(isEn ? "Record incident case" : "录入事故案例", () => {
              const labId = Number(value(form, "lab_id"));
              if (!labId) {
                throw new Error(isEn ? "Select a laboratory" : "请选择实验室");
              }
              return api.createIncident({
                lab_id: labId,
                title: value(form, "title"),
                lab_name: labs.find((l) => l.id === labId)?.name ?? undefined,
                occurred_on: value(form, "occurred_on"),
                severity: value(form, "severity"),
                category: value(form, "category"),
                root_cause: value(form, "root_cause"),
                corrective_actions: value(form, "corrective_actions"),
                file_url: optionalValue(form, "file_url"),
              });
            })
          }
        >
          <FormSelect name="lab_id" defaultValue={selectedLabId ? String(selectedLabId) : ""}>
            <option value="" disabled>{isEn ? "Select lab" : "选择实验室"}</option>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </FormSelect>
          <FormInput name="title" placeholder={isEn ? "Case title" : "案例标题"} />
          <FormInput
            name="occurred_on"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <FormSelect name="severity" defaultValue="">
            <option value="" disabled>{isEn ? "Select severity" : "选择严重程度"}</option>
            <option value="low">{isEn ? "Low" : "低"}</option>
            <option value="medium">{isEn ? "Medium" : "中"}</option>
            <option value="high">{isEn ? "High" : "高"}</option>
            <option value="critical">{isEn ? "Critical" : "重大"}</option>
          </FormSelect>
          <FormInput name="category" placeholder={isEn ? "Category" : "分类"} />
          <FormInput name="root_cause" placeholder={isEn ? "Root cause" : "根因"} />
          <FormInput name="corrective_actions" placeholder={isEn ? "Corrective actions" : "整改措施"} />
          <FormInput name="file_url" placeholder={isEn ? "Attachment URL (optional, upload first)" : "附件URL (可选，先用上传按钮)"} />
        </ActionForm>
      ) : null}

      {showHazards ? (
<ActionForm
          title={isEn ? "Report hazard" : "上报隐患"}
          actionKey="hazard-report"
          onSubmit={(form) =>
            submitAction(isEn ? "Report hazard" : "上报隐患", async () => {
              const user = sessionUserOrThrow(session);
              const labId = Number(value(form, "lab_id"));
              if (!labId) {
                throw new Error(isEn ? "Select a laboratory" : "请选择实验室");
              }
              return api.createHazard({
                lab_id: labId,
                title: value(form, "title"),
                category: value(form, "category"),
                description: value(form, "description"),
                reported_by: user.id,
                issue_photo_url: optionalValue(form, "issue_photo_url"),
              });
            })
          }
        >
          <FormSelect name="lab_id" defaultValue={selectedLabId ? String(selectedLabId) : ""}>
            <option value="" disabled>{isEn ? "Select lab" : "选择实验室"}</option>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </FormSelect>
          <FormInput name="title" placeholder={isEn ? "Hazard title" : "隐患标题"} />
          <FormInput name="category" placeholder={isEn ? "Category" : "分类"} />
          <FormInput name="description" placeholder={isEn ? "Issue description" : "问题描述"} />
          <FormInput name="issue_photo_url" placeholder={isEn ? "Issue photo URL (upload first)" : "问题照片URL（可先上传照片）"} />
        </ActionForm>
      ) : null}

      {isAdmin && showTrainings ? (
<ActionForm
          title={isEn ? "Create training" : "创建培训"}
          actionKey="training"
          onSubmit={(form) =>
            submitAction(isEn ? "Create training" : "创建培训", () =>
              api.createTraining({
                title: value(form, "title"),
                target_role: value(form, "target_role"),
                status: value(form, "status"),
                starts_on: optionalValue(form, "starts_on"),
                exam_required_score: numberValue(
                  form,
                  "exam_required_score",
                ),
              }),
            )
          }
        >
          <FormInput name="title" placeholder={isEn ? "Training title" : "培训标题"} />
          <FormSelect name="target_role" defaultValue="">
            <option value="" disabled>{isEn ? "Select target role" : "选择目标角色"}</option>
            <option value="lab_admin">{isEn ? "Lab admin" : "实验室管理员"}</option>
            <option value="lab_member">{isEn ? "Lab member" : "实验室成员"}</option>
            <option value="visitor">{isEn ? "Visitor" : "访客"}</option>
          </FormSelect>
          <FormSelect name="status" defaultValue="">
            <option value="" disabled>{isEn ? "Select training status" : "选择培训状态"}</option>
            <option value="draft">{isEn ? "Draft" : "草稿"}</option>
            <option value="active">{isEn ? "Active" : "启用"}</option>
            <option value="archived">{isEn ? "Archived" : "归档"}</option>
          </FormSelect>
          <FormInput name="starts_on" type="date" />
          <FormInput
            name="exam_required_score"
            type="number"
            placeholder={isEn ? "Passing score" : "合格分数"}
            min="0"
            max="100"
          />
        </ActionForm>
      ) : null}

      {isAdmin && showEquipment ? (
<ActionForm
          title={isEn ? "Register equipment" : "登记设备"}
          onSubmit={(form) =>
            submitAction(isEn ? "Register equipment" : "登记设备", () => {
              const labId = Number(value(form, "lab_id"));
              if (!labId) {
                throw new Error(isEn ? "Select a laboratory" : "请选择实验室");
              }
              return api.createEquipment({
                asset_code: value(form, "asset_code"),
                name: value(form, "name"),
                lab_id: labId,
                lab_name: labs.find((l) => l.id === labId)?.name ?? undefined,
                status: value(form, "status"),
                owner: optionalValue(form, "owner"),
              });
            })
          }
        >
          <FormSelect name="lab_id" defaultValue={selectedLabId ? String(selectedLabId) : ""}>
            <option value="" disabled>{isEn ? "Select lab" : "选择实验室"}</option>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </FormSelect>
          <FormInput name="asset_code" placeholder={isEn ? "Asset code" : "资产编号"} />
          <FormInput name="name" placeholder={isEn ? "Equipment name" : "设备名称"} />
          <FormSelect name="status" defaultValue="">
            <option value="" disabled>{isEn ? "Select equipment status" : "选择设备状态"}</option>
            <option value="available">{isEn ? "Available" : "可预约"}</option>
            <option value="in_use">{isEn ? "In use" : "使用中"}</option>
            <option value="maintenance">{isEn ? "Maintenance" : "维护中"}</option>
            <option value="retired">{isEn ? "Retired" : "停用"}</option>
          </FormSelect>
          <FormInput name="owner" placeholder={isEn ? "Owner" : "负责人"} />
        </ActionForm>
      ) : null}

      {showEquipment ? (
<ActionForm
          title={isEn ? "Book equipment" : "预约设备"}
          onSubmit={(form) =>
            submitAction(isEn ? "Create equipment booking" : "创建设备预约", () =>
              api.createBooking({
                equipment_id: numberValue(form, "equipment_id"),
                user_id: session.user.id,
                starts_at: datetimeValue(form, "starts_at"),
                ends_at: datetimeValue(form, "ends_at"),
                purpose: value(form, "purpose"),
              }),
            )
          }
        >
          <FormSelect
            name="equipment_id"
            defaultValue={equipment[0]?.id ? String(equipment[0].id) : ""}
          >
            <option value="" disabled>
              {isEn ? "Select equipment" : "选择设备"}
            </option>
            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </FormSelect>
          <FormInput name="starts_at" type="datetime-local" />
          <FormInput name="ends_at" type="datetime-local" />
          <FormInput name="purpose" placeholder={isEn ? "Purpose" : "用途"} />
        </ActionForm>
      ) : null}

      {showRepairs ? (
<ActionForm
          title={isEn ? "Submit repair ticket" : "提交报修"}
          onSubmit={(form) =>
            submitAction(isEn ? "Submit repair ticket" : "提交报修", () =>
              api.createRepair({
                equipment_id: numberValue(form, "equipment_id"),
                reported_by: session.user.id,
                description: value(form, "description"),
                status: "open",
              }),
            )
          }
        >
          <FormSelect
            name="equipment_id"
            defaultValue={equipment[0]?.id ? String(equipment[0].id) : ""}
          >
            <option value="" disabled>
              {isEn ? "Select equipment" : "选择设备"}
            </option>
            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </FormSelect>
          <FormInput name="description" placeholder={isEn ? "Fault description" : "故障描述"} />
        </ActionForm>
      ) : null}

      {showTrainings ? (
        <ActionForm
          title={isEn ? "Record exam result" : "登记考核"}
          actionKey="exam-result"
          onSubmit={(form) =>
            submitAction(isEn ? "Record exam result" : "登记考核", () =>
              api.createExamResult(
                numberValue(form, "training_id"),
                session.user.id,
                numberValue(form, "score"),
              ),
            )
          }
        >
          <FormSelect
            name="training_id"
            defaultValue={trainings[0]?.id ? String(trainings[0].id) : ""}
          >
            <option value="" disabled>
              {isEn ? "Select training" : "选择培训"}
            </option>
            {trainings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </FormSelect>
          <FormInput name="score" type="number" placeholder={isEn ? "Actual score" : "实际得分"} min="0" max="100" />
        </ActionForm>
      ) : null}

      {isAdmin && showUsers ? (
        <ActionForm
          title={isEn ? "Create user" : "创建用户"}
          onSubmit={async (form) => {
            const labRole = value(form, "lab_role");
            const labId = optionalValue(form, "lab_id");
            const authProvider = value(form, "auth_provider");
            if ((labRole === "lab_admin" || labRole === "lab_member") && !labId) {
              throw new Error(isEn ? "Lab admins and lab members must select a lab." : "实验室管理员和实验室成员必须选择要绑定的实验室");
            }
            if (authProvider === "password" && !authMethods.password) {
              throw new Error(isEn ? "Password login is disabled, so password users cannot be created." : "当前系统未启用账号密码登录，不能创建密码登录用户");
            }
            if (authProvider === "sso" && !authMethods.sso) {
              throw new Error(isEn ? "SSO login is disabled, so SSO users cannot be created." : "当前系统未启用 SSO 登录，不能创建 SSO 用户");
            }
            if (authProvider === "oauth" && !authMethods.oauth) {
              throw new Error(isEn ? "OAuth login is disabled, so OAuth users cannot be created." : "当前系统未启用 OAuth 登录，不能创建 OAuth 用户");
            }
            const user = await api.createUser(userCreateValue(form));
            if (labId) {
              await api.assignLabUser(Number(labId), {
                user_id: user.id,
                lab_role: labRole as "lab_admin" | "lab_member" | "visitor",
              });
            }
            return user;
          }}
        >
          <FormInput name="username" autoComplete="username" required placeholder={isEn ? "Username" : "用户名"} />
          <FormInput name="display_name" autoComplete="name" required placeholder={isEn ? "Display name" : "显示名"} />
          <FormInput name="email" type="email" autoComplete="email" required placeholder={isEn ? "Email" : "邮箱"} />
          <FormSelect name="lab_role" defaultValue="lab_member">
            <option value="lab_admin">{isEn ? "Lab admin (lab required)" : "实验室管理员（绑定实验室）"}</option>
            <option value="lab_member">{isEn ? "Lab member (lab required)" : "实验室成员（绑定实验室）"}</option>
            <option value="visitor">{isEn ? "Visitor (lab optional)" : "访客（可不绑定实验室）"}</option>
          </FormSelect>
          <FormSelect name="lab_id" defaultValue="">
            <option value="">{isEn ? "No lab (recommended for visitors only)" : "不绑定实验室（仅访客推荐）"}</option>
            {labs.length > 0 ? (
              labs.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} ({lab.code})
                </option>
              ))
            ) : (
              <option value="" disabled>{isEn ? "(Create a lab first)" : "（请先创建实验室）"}</option>
            )}
          </FormSelect>
          <FormSelect name="auth_provider" defaultValue="password">
            <option value="password" disabled={!authMethods.password}>
              {isEn ? "Password" : "账号密码"}{authMethods.password ? "" : isEn ? " (disabled)" : "（未启用）"}
            </option>
            <option value="sso" disabled={!authMethods.sso}>
              SSO{authMethods.sso ? "" : isEn ? " (disabled)" : "（未启用）"}
            </option>
            <option value="oauth" disabled={!authMethods.oauth}>
              OAuth{authMethods.oauth ? "" : isEn ? " (disabled)" : "（未启用）"}
            </option>
          </FormSelect>
          <FormInput name="department" autoComplete="organization" placeholder={isEn ? "Department / lab" : "部门/实验室"} />
          <FormInput
            name="password"
            type="password"
            placeholder={isEn ? "Strong password, required for password login" : "强密码，密码登录必填"}
            autoComplete="new-password"
          />
        </ActionForm>
      ) : null}

      {showHazards ? (
        <button
          type="button"
          onClick={() =>
            void withAction(isEn ? "Claim responsibility" : "责任认领", () =>
              claimFirstHazard(session, hazards),
            ).catch(() => undefined)
          }
          className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-4 py-4 text-sm font-medium text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-200 dark:hover:border-stone-600"
        >
          <FlaskConical size={16} />
          {isEn ? "Claim responsibility" : "责任认领"}
        </button>
      ) : null}

      {isAdmin && showRegulations ? (
        <UploadButton
          label={isEn ? "Upload regulation file" : "上传法规文件"}
          icon={<ClipboardList size={16} />}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md"
          onFile={(file) =>
            void withAction(isEn ? "Upload regulation file" : "上传法规文件", () => api.uploadRegulation(file)).catch(
              () => undefined,
            )
          }
        />
      ) : null}
      {isAdmin && showIncidents ? (
        <UploadButton
          label={isEn ? "Upload case attachment" : "上传案例附件"}
          icon={<AlertTriangle size={16} />}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md"
          onFile={(file) =>
            void withAction(isEn ? "Upload case attachment" : "上传案例附件", () => api.uploadIncident(file)).catch(
              () => undefined,
            )
          }
        />
      ) : null}
      {showHazards ? (
        <UploadButton
          label={isEn ? "Upload issue photo" : "上传问题照片"}
          icon={<ShieldCheck size={16} />}
          accept="image/*"
          onFile={(file) =>
            void withAction(isEn ? "Upload issue photo" : "上传问题照片", () =>
              uploadHazardIssuePhotoForReport(session, file),
            ).catch(() => undefined)
          }
        />
      ) : null}
      {showHazards ? (
        <UploadButton
          label={isEn ? "Upload remediation photo" : "上传整改照片"}
          icon={<Wrench size={16} />}
          accept="image/*"
          onFile={(file) =>
            void withAction(isEn ? "Upload remediation photo" : "上传整改照片", () =>
              remediateFirstHazard(session, hazards, file),
            ).catch(() => undefined)
          }
        />
      ) : null}
      </div>
    </section>
  );
}
