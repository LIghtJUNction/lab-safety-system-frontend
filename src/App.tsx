import { useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  AuthMethods,
  AuthSession,
  Booking,
  DashboardStats,
  Equipment,
  HazardAnalytics,
  Incident,
  IncidentAnalytics,
  Regulation,
  RegulationAnalytics,
  RepairTicket,
  SafetyHazard,
  Training,
  User,
  Lab,
  LabMembership,
  LabUser,
  getApiBase,
} from "./api";
import { LoginScreen } from "./components/auth/LoginScreen";
import { InvitationRegisterScreen } from "./components/auth/InvitationRegisterScreen";
import { DashboardMainContent } from "./components/dashboard/DashboardMainContent";
import { QuickActionsPanel } from "./components/dashboard/QuickActionsPanel";
import { MobileNav } from "./components/layout/MobileNav";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import { useDashboardRows } from "./hooks/useDashboardRows";
import { useLoginCarousel } from "./hooks/useLoginCarousel";
import { usePreferences } from "./hooks/usePreferences";
import { useTelemetry } from "./hooks/useTelemetry";
import { appNotice } from "./lib/appNotice";
import { readSession } from "./lib/auth";
import { SESSION_KEY } from "./lib/constants";
import { pageCopyForRole, pageTitleForContext, visibleNavForRole } from "./lib/navigation";
import { bindPasskey } from "./lib/passkeyActions";
import {
  canManageSystem,
  canViewLab,
} from "./lib/permissions";
import { parseAppRoute, routeLabel, routePathForLabel, routeVisibility } from "./lib/router";
export function App() {
  const { language, setLanguage, theme, setTheme, isDark } = usePreferences();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
const [notice, setNotice] = useState(appNotice.connecting(language));
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<IncidentAnalytics>({
    by_category: [],
    by_severity: [],
  });
  const [hazardAnalytics, setHazardAnalytics] = useState<HazardAnalytics>({
    by_status: [],
    by_category: [],
  });
  const [regulationAnalytics, setRegulationAnalytics] = useState<RegulationAnalytics>({
    by_type: [],
    by_authority: [],
  });
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [hazards, setHazards] = useState<SafetyHazard[]>([]);
  const [session, setSession] = useState<AuthSession | null>(() => readSession());

  // New multi-lab support states
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
  const [labMemberships, setLabMemberships] = useState<LabMembership[] | null>(null);
  const [labMembers, setLabMembers] = useState<LabUser[]>([]);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [viewingLabMembers, setViewingLabMembers] = useState<{ labId: number; name: string } | null>(null);
  const [viewingLabMembersList, setViewingLabMembersList] = useState<LabUser[]>([]);

  const {
    loginCarousel,
    setLoginCarousel,
    carouselSaving,
    showLoginBanner,
    setShowLoginBanner,
    saveLoginCarousel,
    resetToDefault,
    syncLanguages,
    cloneSlide,
    updateCarouselSlide,
    addCarouselSlide,
    removeCarouselSlide,
} = useLoginCarousel(setNotice, language);

  const [authMethods, setAuthMethods] = useState<AuthMethods>({
    password: true,
    sso: false,
    oauth: false,
    sso_login_url: null,
    oauth_login_url: null,
  });
  const lastActionAt = useRef(0);

  // Custom router state
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (pathStr: string) => {
    window.history.pushState({}, "", pathStr);
    setCurrentPath(pathStr);
  };

  const parsedRoute = useMemo(() => parseAppRoute(currentPath), [currentPath]);

  const isSystemAdmin = session?.user.role === "system_admin";

  const currentLabRole = (() => {
    if (!selectedLabId || !session || !labMemberships) return null;
    if (isSystemAdmin) return "system_admin" as const;
    const m = labMemberships.find((m) => m.lab_id === selectedLabId);
    return m ? m.role : null;
  })();

  const isAdmin = isSystemAdmin || currentLabRole === "lab_admin" || session?.user.role === "admin" || session?.user.role === "super_admin";


  const sensors = useTelemetry(hazards, repairs);


  async function refresh(search = query, options?: { silent?: boolean }) {
    setLoading(true);
    try {
      const canManageUsers = isSystemAdmin || currentLabRole === "lab_admin";
      const [
        nextStats,
        nextAnalytics,
        nextHazardAnalytics,
        nextRegulationAnalytics,
        nextRegulations,
        nextIncidents,
        nextTrainings,
        nextEquipment,
        nextBookings,
        nextRepairs,
        nextUsers,
        nextHazards,
        nextLabMembers,
      ] = await Promise.all([
        api.dashboard(selectedLabId || undefined),
        api.incidentAnalytics(selectedLabId || undefined),
        api.hazardAnalytics(selectedLabId || undefined),
        api.regulationAnalytics(),
        api.regulations(search),
        api.incidents(search, selectedLabId || undefined),
        api.trainings(),
        api.equipment(search, selectedLabId || undefined),
        api.bookings(selectedLabId || undefined),
        api.repairs(selectedLabId || undefined),
        canManageUsers ? api.users() : Promise.resolve([]),
        api.hazards(search, selectedLabId || undefined),
        selectedLabId ? api.listLabUsers(selectedLabId) : Promise.resolve([]),
      ]);
      setStats(nextStats);
      setAnalytics(nextAnalytics);
      setHazardAnalytics(nextHazardAnalytics);
      setRegulationAnalytics(nextRegulationAnalytics);
      setRegulations(nextRegulations);
      setIncidents(nextIncidents);
      setTrainings(nextTrainings);
      setEquipment(nextEquipment);
      setBookings(nextBookings);
      setRepairs(nextRepairs);
      setUsers(nextUsers);
      setHazards(nextHazards);
      setLabMembers(nextLabMembers);
      if (!options?.silent && Date.now() - lastActionAt.current > 4000) {
        setNotice(appNotice.connected(language));
      }
    } catch (error) {
      const currentBase = getApiBase ? getApiBase() : "/api/v1";
      setNotice(appNotice.backendFailed(language, error instanceof Error ? error.message : null, currentBase));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void api.authMethods().then(setAuthMethods).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!session) return;
    api.setAccessToken(session.access_token);
    void api
      .me()
      .then(async (user) => {
        const nextSession = { ...session, user };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        setSession(nextSession);

        try {
          const memberships = await api.myLabMemberships();
          setLabMemberships(memberships);

          let userLabs: Lab[] = [];
          if (user.role === "system_admin") {
            userLabs = await api.labs();
            // Load global login carousel for editing
            api.loginCarousel().then(setLoginCarousel).catch(() => {});
          } else {
            const allLabs = await api.labs();
            const myLabIds = new Set(memberships.map((m) => m.lab_id));
            userLabs = allLabs.filter((l) => myLabIds.has(l.id));
          }
          setLabs(userLabs);

          const parts = window.location.pathname.split("/").filter(Boolean);
          if (parts[0] === "labs" && parts[1]) {
            const parsedId = parseInt(parts[1], 10);
            if (!isNaN(parsedId)) {
              setSelectedLabId(parsedId);
            }
          } else if (userLabs.length > 0) {
            setSelectedLabId(userLabs[0].id);
          }
        } catch (e) {
          console.warn("Failed to load labs/memberships", e);
        }

        return refresh("");
      })
      .catch(() => {
        api.setAccessToken(null);
        window.localStorage.removeItem(SESSION_KEY);
        setSession(null);
      });
  }, [session?.access_token]);

  useEffect(() => {
    if (!session) return undefined;
    const timer = window.setTimeout(() => void refresh(query), 300);
    return () => window.clearTimeout(timer);
  }, [query, session]);

  useEffect(() => {
    if (session) {
      void refresh(query);
    }
  }, [selectedLabId]);

  useEffect(() => {
    if (!session || !labMemberships) return;
    const user = session.user;
    const { isSystemRoute, isLabRoute, urlLabId } = parsedRoute;

    if (currentPath === "/" || currentPath === "/index.html") {
      if (user.role === "system_admin") {
        navigateTo("/system/overview");
      } else if (labs.length > 0) {
        navigateTo(`/labs/${labs[0].id}/overview`);
      } else {
        navigateTo("/labs/0/overview");
      }
      return;
    }

    if (isSystemRoute && !canManageSystem(user)) {
      if (labs.length > 0) {
        navigateTo(`/labs/${labs[0].id}/overview`);
      } else {
        navigateTo("/labs/0/overview");
      }
      return;
    }

    if (isLabRoute && urlLabId === 0 && labs.length > 0) {
      navigateTo(`/labs/${labs[0].id}/${parsedRoute.labTab || "overview"}`);
      return;
    }

    if (isLabRoute && urlLabId !== null && urlLabId !== selectedLabId) {
      if (user.role === "system_admin" || labMemberships.some((m) => m.lab_id === urlLabId)) {
        setSelectedLabId(urlLabId);
      } else {
        if (labs.length > 0) {
          navigateTo(`/labs/${labs[0].id}/overview`);
        } else {
          navigateTo("/labs/0/overview");
        }
      }
    }
  }, [currentPath, session, labs, labMemberships, parsedRoute, selectedLabId]);

const {
  regulationRows,
  incidentRows,
  trainingRows,
  equipmentRows,
  bookingRows,
  repairRows,
  userRows,
  labRows,
  hazardRows,
} = useDashboardRows({
  regulations,
  incidents,
  trainings,
  equipment,
  bookings,
  repairs,
  users,
  labs,
  hazards,
  isAdmin,
  sessionUserId: session?.user.id ?? 0,
  withAction,
});

const {
  incidentBars,
  regulationBars,
  alertCount,
  onlineCount,
  safetyDays,
  alertItems,
  exportAnalytics,
} = useDashboardMetrics({
  analytics,
  regulationAnalytics,
  hazardAnalytics,
  hazards,
  repairs,
  bookings,
  stats,
  isAdmin,
});

  async function withAction(label: string, action: () => Promise<unknown>): Promise<void> {
    lastActionAt.current = Date.now();
    setNotice(appNotice.processing(language, label));
    try {
      const result = await action();
      await refresh(query, { silent: true });
      lastActionAt.current = Date.now();
      const uploadedUrl =
        result &&
        typeof result === "object" &&
        "url" in result &&
        typeof result.url === "string"
          ? result.url
          : "";
      setNotice(appNotice.success(language, label, uploadedUrl));
    } catch (error) {
      setNotice(
        appNotice.failure(language, label, error instanceof Error ? error.message : undefined),
      );
      // Rethrow so ActionForm (and other awaiters) never treat failure as success.
      throw error;
    }
  }

  async function submitAction(label: string, action: () => Promise<unknown>): Promise<void> {
    await withAction(label, action);
  }

  const { isSystemRoute } = parsedRoute;

  const active = routeLabel(parsedRoute);

  const setActive = (label: string) => {
    navigateTo(routePathForLabel(label, isSystemAdmin, selectedLabId || 0));
  };

  const handleLabChange = (labId: number) => {
    setSelectedLabId(labId);
    // Keep current page tab when switching labs (lab-scoped routes).
    if (!isSystemAdmin || parsedRoute.isLabRoute) {
      navigateTo(routePathForLabel(routeLabel(parsedRoute), isSystemAdmin, labId));
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem("sidebarCollapsed") === "1";
    } catch {
      return false;
    }
  });
  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const visibleNav = visibleNavForRole(isSystemAdmin, currentLabRole);
  const pageTitle = pageTitleForContext(isSystemAdmin, currentLabRole, labs, selectedLabId, language);
  const pageCopy = pageCopyForRole(isSystemAdmin, currentLabRole, language);

  const {
    showSystemOverview,
    showSystemConfig,
    showOverview,
    showRegulations,
    showIncidents,
    showHazards,
    showTrainings,
    showEquipment,
    showRepairs,
    showUsers,
    showAnalytics,
    showLabManagement,
    showInvitations,
  } = routeVisibility(parsedRoute);

  if (!session) {
    if (parsedRoute.isJoinRoute) {
      return (
        <InvitationRegisterScreen
          code={parsedRoute.inviteCode}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          onBackToLogin={() => navigateTo("/")}
        />
      );
    }
    return (
      <LoginScreen
        authMethods={authMethods}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        onLogin={setSession}
      />
    );
  }

const dashboardMainProps = {
  showLabManagement, showSystemConfig, showOverview, showSystemOverview, showInvitations,
  showAnalytics, showTrainings, showRegulations, showIncidents, showHazards, showEquipment,
  showRepairs, showUsers, isSystemAdmin, isSystemRoute, isAdmin, language, selectedLabId,
  labs, setLabs, session, stats, hazards, trainings, safetyDays, onlineCount, alertCount,
  sensors, alertItems, incidentBars, hazardAnalytics, regulationBars, regulationRows,
  incidentRows, hazardRows, trainingRows, equipmentRows, bookingRows, repairRows, userRows,
  labRows, showLoginBanner, setShowLoginBanner, loginCarousel, carouselSaving, syncLanguages,
  resetToDefault, saveLoginCarousel, cloneSlide, addCarouselSlide, removeCarouselSlide,
  updateCarouselSlide, setNotice, setActive, submitAction, withAction, exportAnalytics,
};
const quickActionsProps = {
  isAdmin, showRegulations, showIncidents, showHazards, showTrainings, showEquipment,
  showRepairs, showUsers, language, session, authMethods, selectedLabId, labs, equipment, trainings, hazards,
  submitAction, withAction,
};

  return (
    <main className="app-shell flex min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar
        active={active}
        visibleNav={visibleNav}
        language={language}
        onNavigate={setActive}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      <section className="workspace lab-grid-bg flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">
            <MobileNav
              active={active}
              visibleNav={visibleNav}
              language={language}
              onNavigate={setActive}
            />
            <TopBar
              pageTitle={pageTitle}
              pageCopy={pageCopy}
              notice={notice}
              loading={loading}
              session={session}
              isAdmin={isAdmin}
              language={language}
              query={query}
              theme={theme}
              labs={labs}
              selectedLabId={selectedLabId}
              currentLabRole={currentLabRole}
              onQueryChange={setQuery}
              onLabChange={handleLabChange}
              onBindPasskey={() =>
                void withAction(appNotice.bindPasskey(language), () => bindPasskey(session)).catch(
                  () => undefined,
                )
              }
              onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
              onLogout={() => {
                api.setAccessToken(null);
                window.localStorage.removeItem(SESSION_KEY);
                setSession(null);
              }}
              onRetry={() => void refresh(query)}
            />

            <DashboardMainContent {...dashboardMainProps} />

            <QuickActionsPanel {...quickActionsProps} />
          </div>
        </div>
      </section>
    </main>
  );
}
