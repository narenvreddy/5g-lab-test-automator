import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  ChevronDown,
  Loader2,
  Play,
  Plus,
  Signal,
  Wifi,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type TestRow,
  createTest,
  deleteTest,
  getDevices,
  getTests,
  startTest,
  updateTest,
} from "./api";

const STATUS_CONFIG = {
  idle: {
    label: "Ready",
    // Muted indigo — calm, professional
    color: "bg-muted text-muted-foreground border-border",
  },
  running: {
    label: "Running",
    // Rich royal blue — active and trustworthy
    color: "bg-primary/12 text-primary border-primary/35",
  },
  completed: {
    label: "Completed",
    // Emerald teal — success, executive-grade
    color: "bg-chart-1/12 text-chart-1 border-chart-1/35",
  },
  error: {
    label: "Error",
    // Warm red — visible but not neon
    color: "bg-destructive/12 text-destructive border-destructive/35",
  },
};

// Local-only UI state (not persisted to backend)
interface RowUI {
  isFetchingDetails: boolean;
}

/** Auto-resize a textarea to fit its content */
function FiveGIcon() {
  return (
    <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 glow-primary">
      <Wifi className="w-5 h-5 text-primary" />
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full flex items-center justify-center shadow-md">
        <span className="text-[6px] font-bold text-primary-foreground leading-none">
          5G
        </span>
      </span>
    </div>
  );
}

/** Fixed-height Details textarea: collapses when empty, fixed height with scroll when text is present */
function DetailsTextarea({ details }: { details: string }) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: details drives height update
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    if (!el.value.trim()) {
      // Empty — collapse to single line, no scroll
      el.style.height = "2rem";
      el.style.overflowY = "hidden";
    } else {
      // Has content — fixed standard height, scrollable
      el.style.height = "5rem";
      el.style.overflowY = "auto";
    }
  }, [details]);

  return (
    <textarea
      ref={taRef}
      data-ocid="details-textarea"
      value={details}
      readOnly
      rows={1}
      className="px-3 py-1.5 rounded-md border border-border bg-muted/25 text-sm text-muted-foreground resize-none w-full focus:outline-none leading-snug"
      style={{ minHeight: "2rem", height: "2rem", overflowY: "hidden" }}
      placeholder="—"
    />
  );
}

function TestRowCard({
  row,
  rowIndex,
  isFetchingDetails,
  devices,
  onTestIdChange,
  onDeviceIdChange,
  onRequestTypeChange,
  onStart,
  onDelete,
}: {
  row: TestRow;
  rowIndex: number;
  isFetchingDetails: boolean;
  devices: string[];
  onTestIdChange: (id: string, value: string) => void;
  onDeviceIdChange: (id: string, value: string) => void;
  onRequestTypeChange: (id: string, value: string) => void;
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[row.status];
  return (
    <div
      data-ocid="test-row-card"
      className="relative group flex flex-col gap-0 rounded-xl card-premium hover:border-primary/45 hover:shadow-lg transition-smooth overflow-hidden"
    >
      {/* Left accent bar — indigo stripe for premium feel */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/60 via-accent/30 to-transparent rounded-l-xl" />

      {/* Delete button — top-right */}
      <button
        type="button"
        data-ocid="delete-row-btn"
        onClick={() => onDelete(row.id)}
        aria-label="Delete row"
        className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/12 transition-smooth opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* ── Main row: all fields on one line ── */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-3 pr-10 pl-5">
        {/* Row number */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-xs font-mono text-primary/70 text-center">
              {String(rowIndex + 1).padStart(2, "00")}
            </span>
          </div>
        </div>

        {/* Test ID */}
        <div className="flex flex-col gap-1 w-[150px] flex-shrink-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
            Test ID
          </Label>
          <Input
            data-ocid="test-id-input"
            value={row.testId}
            onChange={(e) => onTestIdChange(row.id, e.target.value)}
            className="h-8 text-sm font-mono bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary/25"
          />
        </div>

        {/* Request Type */}
        <div className="flex flex-col gap-1 w-[120px] flex-shrink-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
            Request Type
          </Label>
          <Input
            data-ocid="request-type-input"
            value={row.requestType}
            onChange={(e) => onRequestTypeChange(row.id, e.target.value)}
            className="h-8 text-sm bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary/25"
            placeholder="e.g. UE Capa"
          />
        </div>

        {/* Details — flex-1, auto-resizing textarea */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
            Details
          </Label>
          {isFetchingDetails ? (
            <div
              data-ocid="details-loading"
              className="h-8 flex items-center gap-2 text-sm text-primary px-3 rounded-md border border-primary/25 bg-primary/8"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              <span className="text-xs">Fetching data…</span>
            </div>
          ) : (
            <DetailsTextarea details={row.details} />
          )}
        </div>

        {/* Device ID — dropdown populated from adb devices */}
        <div className="flex flex-col gap-1 w-[150px] flex-shrink-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
            Device ID
          </Label>
          <div className="relative">
            <select
              data-ocid="device-id-select"
              value={row.deviceId}
              disabled={devices.length === 0}
              onChange={(e) => {
                onDeviceIdChange(row.id, e.target.value);
                if (!row.id.startsWith("local-")) {
                  updateTest(row.id, { deviceId: e.target.value }).catch(
                    console.error,
                  );
                }
              }}
              className="h-8 w-full text-sm font-mono bg-background border border-input text-foreground rounded-md px-2 pr-7 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {devices.length === 0 ? (
                <option value="">No devices found</option>
              ) : (
                <>
                  <option value="">Select device…</option>
                  {devices.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </>
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Start button + status — fixed column, results below */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 items-center justify-center">
          {/* Status badge sits above button as the "label" row */}
          <Badge
            variant="outline"
            className={`text-[10px] font-medium px-2 py-0 h-[18px] border self-end ${statusCfg.color}`}
          >
            {row.status === "running" && (
              <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
            {statusCfg.label}
          </Badge>
          <Button
            data-ocid="start-test-btn"
            size="sm"
            onClick={() => onStart(row.id)}
            disabled={row.status === "running"}
            className="h-8 px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/85 shadow-lg shadow-primary/25 border border-primary/50 transition-smooth disabled:opacity-40 gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" />
            {row.status === "running" ? "Running…" : "Start"}
          </Button>
        </div>
      </div>

      {/* ── Results row — below Start button, full width ── */}
      {(row.results ||
        row.status === "completed" ||
        row.status === "error") && (
        <div className="flex items-center gap-2 px-5 py-2 bg-muted/15 border-t border-border/50">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest flex-shrink-0">
            Results
          </Label>
          <div
            data-ocid="results-display"
            className={`flex-1 text-sm font-mono px-3 py-1 rounded-md border ${
              row.status === "error"
                ? "text-destructive bg-destructive/8 border-destructive/25"
                : "text-foreground bg-muted/20 border-border/70"
            } break-words`}
          >
            {row.results || (
              <span className="text-muted-foreground italic text-xs">
                No result yet
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Generate a temporary local ID that won't collide with backend UUIDs */
function tempId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeEmptyRow(id: string): TestRow {
  return {
    id,
    testId: "",
    deviceId: "",
    requestType: "",
    details: "",
    results: "",
    status: "idle",
  };
}

export default function App() {
  const [rows, setRows] = useState<TestRow[]>([]);
  const [rowUI, setRowUI] = useState<Record<string, RowUI>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [devices, setDevices] = useState<string[]>([]);

  // Map of row id → debounce timer ref
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  // Fetch connected ADB devices and refresh every 30s
  const fetchDevices = useCallback(async () => {
    const url = `${"http://localhost:8001"}/api/devices`;
    console.log(`[App] Fetching devices — GET ${url}`);
    try {
      const data = await getDevices();
      console.log("[App] Devices response:", data);
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[App] Failed to fetch devices:", err);
      setDevices([]);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30_000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  // Load existing tests on mount; create a default one if empty.
  // If backend is unreachable, fall back to a single local row so the UI
  // is immediately usable even without the server running.
  useEffect(() => {
    (async () => {
      try {
        let data = await getTests();
        if (data.length === 0) {
          const defaultRow = await createTest(makeEmptyRow(""));
          data = [defaultRow];
        }
        setRows(data);
      } catch (err) {
        console.error("[App] Failed to load tests:", err);
        // Backend unreachable — start with one local row
        setRows([makeEmptyRow(tempId())]);
        setServerError(
          "Could not connect to the local server. Changes are local only and will not be saved.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const handleTestIdChange = useCallback((id: string, value: string) => {
    // Optimistic local update
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, testId: value } : r)),
    );

    // Persist to backend (debounced for TP auto-fetch)
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
      delete debounceTimers.current[id];
    }

    const isLocal = id.startsWith("local-");

    if (value.startsWith("TP")) {
      // Mark row as fetching details
      setRowUI((prev) => ({
        ...prev,
        [id]: { ...prev[id], isFetchingDetails: true },
      }));

      debounceTimers.current[id] = setTimeout(async () => {
        const url = `http://107.111.159.37:8000/api/tp/data/${value}`;
        console.log(`[App] Fetching TP details — GET ${url}`);
        try {
          const response = await fetch(url, { redirect: "follow" });
          const data = await response.json();
          console.log("[App] TP API response:", data);
          const description: string =
            typeof data?.description === "string" ? data.description : "";
          const testType: string =
            typeof data?.testType === "string" ? data.testType : "";
          console.log("[TP API] testType:", data.testType);
          setRows((prev) =>
            prev.map((r) =>
              r.id === id
                ? { ...r, details: description, requestType: testType }
                : r,
            ),
          );
          // Persist testId + details + requestType to backend if row is saved
          if (!isLocal) {
            await updateTest(id, {
              testId: value,
              details: description,
              requestType: testType,
            }).catch(console.error);
          }
        } catch (err) {
          console.error("[App] TP API fetch error:", err);
          const msg = err instanceof Error ? err.message : String(err);
          setRows((prev) =>
            prev.map((r) =>
              r.id === id ? { ...r, details: `API call failed: ${msg}` } : r,
            ),
          );
        } finally {
          setRowUI((prev) => ({
            ...prev,
            [id]: { ...prev[id], isFetchingDetails: false },
          }));
        }
      }, 500);
    } else {
      // Not TP — just persist
      setRowUI((prev) => ({
        ...prev,
        [id]: { ...prev[id], isFetchingDetails: false },
      }));
      if (!isLocal) {
        updateTest(id, { testId: value }).catch(console.error);
      }
    }
  }, []);

  const handleDeviceIdChange = useCallback((id: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, deviceId: value } : r)),
    );
  }, []);

  const handleRequestTypeChange = useCallback((id: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, requestType: value } : r)),
    );
    if (!id.startsWith("local-")) {
      updateTest(id, { requestType: value }).catch(console.error);
    }
  }, []);

  const handleStart = async (id: string) => {
    if (id.startsWith("local-")) {
      setServerError("Could not save to server. Changes are local only.");
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "running" } : r)),
    );
    try {
      const updated = await startTest(id);
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "error", results: `Error: ${msg}` } : r,
        ),
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
      delete debounceTimers.current[id];
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    // Only call server if this row was actually persisted
    if (!id.startsWith("local-")) {
      try {
        await deleteTest(id);
      } catch (err) {
        console.error("[App] Delete failed:", err);
      }
    }
  };

  const handleAddRow = async () => {
    // Optimistic update: add row immediately with a temporary local ID
    const localId = tempId();
    const optimisticRow = makeEmptyRow(localId);
    setRows((prev) => [...prev, optimisticRow]);

    // Attempt to persist to backend in background
    try {
      const saved = await createTest(makeEmptyRow(""));
      // Replace temporary ID with the real backend ID
      setRows((prev) => prev.map((r) => (r.id === localId ? { ...saved } : r)));
    } catch (err) {
      console.error("[App] Failed to save new row to server:", err);
      // Keep the row visible — just warn the user
      setServerError("Could not save to server. Changes are local only.");
    }
  };

  const runningCount = rows.filter((r) => r.status === "running").length;
  const completedCount = rows.filter((r) => r.status === "completed").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Header — premium navy-to-indigo gradient ───────────────── */}
      <header className="sticky top-0 z-50 header-gradient border-b border-border shadow-sm shadow-primary/8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <FiveGIcon />
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-mono text-primary/60 uppercase tracking-[0.18em]">
                Lab Test
              </span>
              <span className="text-base font-display font-semibold text-foreground tracking-tight">
                5G Lab Test Automator
              </span>
            </div>
          </div>

          {/* Right: stats + user */}
          <div className="flex items-center gap-5">
            {/* Live stats */}
            <div className="hidden md:flex items-center gap-4 mr-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  <span className="text-primary font-mono font-semibold">
                    {runningCount}
                  </span>{" "}
                  running
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-chart-1" />
                <span className="text-xs text-muted-foreground">
                  <span className="text-chart-1 font-mono font-semibold">
                    {completedCount}
                  </span>{" "}
                  completed
                </span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <Signal className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono text-primary">
                  NR-SA LIVE
                </span>
              </div>
            </div>

            {/* User profile */}
            <div
              data-ocid="user-profile"
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground leading-none">
                  Lab Engineer
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Admin • 5G-NR
                </p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/35 group-hover:border-primary/65 transition-smooth glow-primary">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold font-display">
                  LE
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-smooth" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Sub-nav strip — slightly deeper indigo tint ────────────── */}
      <div className="bg-muted/60 border-b border-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center gap-6">
          {["Dashboard", "Test Suites", "Reports", "Lab Status"].map(
            (nav, i) => (
              <button
                type="button"
                key={nav}
                data-ocid={`nav-${nav.toLowerCase().replace(" ", "-")}`}
                className={`text-xs font-medium tracking-wide transition-smooth ${
                  i === 0
                    ? "text-primary border-b-2 border-primary pb-0.5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {nav}
              </button>
            ),
          )}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* ── Server error banner ── */}
          {serverError && (
            <div
              data-ocid="server-error-banner"
              role="alert"
              className="flex items-start gap-3 mb-5 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="flex-1 text-sm leading-snug">{serverError}</p>
              <button
                type="button"
                aria-label="Dismiss error"
                data-ocid="dismiss-error-btn"
                onClick={() => setServerError(null)}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section heading */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-display font-semibold text-foreground tracking-tight">
                Test Rows
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {rows.length} test{rows.length !== 1 ? "s" : ""} configured
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-xs border-border text-muted-foreground font-mono"
              >
                Session #4821
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-primary/35 text-primary font-mono bg-primary/8"
              >
                NR-SA · n78
              </Badge>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div
              data-ocid="loading-state"
              className="flex items-center justify-center gap-3 py-16 text-muted-foreground"
            >
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">Loading test rows…</span>
            </div>
          )}

          {/* Test rows */}
          {!isLoading && (
            <div
              data-ocid="test-rows-container"
              className="flex flex-col gap-3"
            >
              {rows.map((row, index) => (
                <TestRowCard
                  key={row.id}
                  row={row}
                  rowIndex={index}
                  isFetchingDetails={rowUI[row.id]?.isFetchingDetails ?? false}
                  devices={devices}
                  onTestIdChange={handleTestIdChange}
                  onDeviceIdChange={handleDeviceIdChange}
                  onRequestTypeChange={handleRequestTypeChange}
                  onStart={handleStart}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Add row button — premium indigo dashed border */}
          {!isLoading && (
            <div className="mt-4">
              <button
                data-ocid="add-row-btn"
                type="button"
                onClick={handleAddRow}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-primary/30 hover:border-primary/55 hover:bg-primary/6 text-muted-foreground hover:text-primary transition-smooth group"
              >
                <div className="w-6 h-6 rounded-md border border-current flex items-center justify-center group-hover:bg-primary/12 transition-smooth">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium">Add Test Row</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-muted/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground font-mono">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.hostname : "",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-smooth"
            >
              Built with love using caffeine.ai
            </a>
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-1 animate-pulse" />
            <span className="text-[11px] font-mono text-muted-foreground">
              System Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
