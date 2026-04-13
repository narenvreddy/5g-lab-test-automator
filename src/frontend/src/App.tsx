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
  getTests,
  startTest,
  updateTest,
} from "./api";

const STATUS_CONFIG = {
  idle: {
    label: "Ready",
    color: "bg-muted text-muted-foreground border-border",
  },
  running: {
    label: "Running",
    color: "bg-primary/10 text-primary border-primary/30",
  },
  completed: {
    label: "Completed",
    color: "bg-chart-1/10 text-chart-1 border-chart-1/30",
  },
  error: {
    label: "Error",
    color: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

// Local-only UI state (not persisted to backend)
interface RowUI {
  isFetchingDetails: boolean;
}

function FiveGIcon() {
  return (
    <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
      <Wifi className="w-5 h-5 text-primary" />
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
        <span className="text-[6px] font-bold text-accent-foreground leading-none">
          5G
        </span>
      </span>
    </div>
  );
}

function TestRowCard({
  row,
  rowIndex,
  isFetchingDetails,
  onTestIdChange,
  onDeviceIdChange,
  onRequestTypeChange,
  onStart,
  onDelete,
}: {
  row: TestRow;
  rowIndex: number;
  isFetchingDetails: boolean;
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
      className="relative group flex flex-col gap-0 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-smooth overflow-hidden"
    >
      {/* Delete button — top-right */}
      <button
        type="button"
        data-ocid="delete-row-btn"
        onClick={() => onDelete(row.id)}
        aria-label="Delete row"
        className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* ── Main row: all fields on one line ── */}
      <div className="flex items-end gap-3 px-4 pt-3 pb-3 pr-10">
        {/* Row number */}
        <div className="flex-shrink-0 self-end mb-1">
          <div className="w-7 h-7 rounded-md bg-muted border border-border flex items-center justify-center">
            <span className="text-xs font-mono text-muted-foreground">
              {String(rowIndex + 1).padStart(2, "0")}
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
            className="h-8 text-sm font-mono bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
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
            className="h-8 text-sm bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
            placeholder="e.g. UE Capa"
          />
        </div>

        {/* Details — flex-1, takes remaining space */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
            Details
          </Label>
          {isFetchingDetails ? (
            <div
              data-ocid="details-loading"
              className="h-8 flex items-center gap-2 text-sm text-primary px-3 rounded-md border border-primary/20 bg-primary/5"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              <span className="text-xs">Fetching data…</span>
            </div>
          ) : (
            <div
              data-ocid="details-text"
              className="h-8 flex items-center px-3 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground min-w-0"
            >
              <span className="truncate">
                {row.details || <span className="italic text-xs">—</span>}
              </span>
            </div>
          )}
        </div>

        {/* Device ID */}
        <div className="flex flex-col gap-1 w-[130px] flex-shrink-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
            Device ID
          </Label>
          <Input
            data-ocid="device-id-input"
            value={row.deviceId}
            onChange={(e) => onDeviceIdChange(row.id, e.target.value)}
            onBlur={(e) => {
              if (!row.id.startsWith("local-")) {
                updateTest(row.id, { deviceId: e.target.value }).catch(
                  console.error,
                );
              }
            }}
            className="h-8 text-sm font-mono bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
            placeholder="DEV-001"
          />
        </div>

        {/* Start button + status — fixed column, results below */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
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
            className="h-8 px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 border border-primary/40 transition-smooth disabled:opacity-40 gap-1.5"
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
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-t border-border/60">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest flex-shrink-0">
            Results
          </Label>
          <div
            data-ocid="results-display"
            className={`flex-1 text-sm font-mono px-3 py-1 rounded-md border ${
              row.status === "error"
                ? "text-destructive bg-destructive/5 border-destructive/20"
                : "text-foreground bg-muted/30 border-border"
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

  // Map of row id → debounce timer ref
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

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
        try {
          if (!isLocal) {
            // First persist the new testId, then trigger start to fetch TP data
            await updateTest(id, { testId: value });
            const updated = await startTest(id);
            setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
          } else {
            // Row not yet saved — show a local error until server is available
            throw new Error("Row not yet saved to server");
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setRows((prev) =>
            prev.map((r) =>
              r.id === id
                ? { ...r, details: `API call failed: ${msg}`, status: "error" }
                : r,
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
    <div className="dark min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <FiveGIcon />
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.18em]">
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
              <Avatar className="h-9 w-9 border-2 border-primary/30 group-hover:border-primary/60 transition-smooth">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold font-display">
                  LE
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-smooth" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Sub-nav strip ──────────────────────────────────────────── */}
      <div className="bg-card/60 border-b border-border/60 backdrop-blur-sm">
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
                className="text-xs border-primary/30 text-primary font-mono"
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
                  onTestIdChange={handleTestIdChange}
                  onDeviceIdChange={handleDeviceIdChange}
                  onRequestTypeChange={handleRequestTypeChange}
                  onStart={handleStart}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Add row button */}
          {!isLoading && (
            <div className="mt-4">
              <button
                data-ocid="add-row-btn"
                type="button"
                onClick={handleAddRow}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-smooth group"
              >
                <div className="w-6 h-6 rounded-md border border-current flex items-center justify-center group-hover:bg-primary/10 transition-smooth">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium">Add Test Row</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-card/40 border-t border-border/60">
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
