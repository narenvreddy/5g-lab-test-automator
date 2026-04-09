import { createActor } from "@/backend";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  ChevronDown,
  Loader2,
  Play,
  Plus,
  Signal,
  Wifi,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type RequestType = "UE Capa" | "NV Filtering" | "";

interface TestRow {
  id: number;
  testId: string;
  requestType: RequestType;
  deviceId: string;
  results: string;
  details: string;
  status: "idle" | "running" | "completed" | "error";
  isFetchingDetails?: boolean;
}

const initialRow: TestRow = {
  id: 1,
  testId: "TEST-5G-001",
  requestType: "UE Capa",
  deviceId: "",
  results: "",
  details:
    "Configure UE capability parameters for 5G NR band n78. Validate PDCP and RLC layer settings with baseline network profile.",
  status: "idle",
};

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
  onUpdate,
  onStart,
  onDelete,
}: {
  row: TestRow;
  onUpdate: (id: number, updates: Partial<TestRow>) => void;
  onStart: (id: number) => void;
  onDelete: (id: number) => void;
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
              {String(row.id).padStart(2, "0")}
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
            onChange={(e) => onUpdate(row.id, { testId: e.target.value })}
            className="h-8 text-sm font-mono bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Request Type */}
        <div className="flex flex-col gap-1 w-[120px] flex-shrink-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
            Request Type
          </Label>
          <div
            data-ocid="request-type-display"
            className="h-8 flex items-center px-3 rounded-md border border-primary/20 bg-primary/5 text-sm font-medium text-primary"
          >
            {row.requestType || (
              <span className="text-muted-foreground italic text-xs">—</span>
            )}
          </div>
        </div>

        {/* Details — flex-1, takes remaining space */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
            Details
          </Label>
          {row.isFetchingDetails ? (
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
          <div
            data-ocid="device-id-display"
            className="h-8 flex items-center text-sm font-mono text-foreground bg-muted/40 border border-border rounded-md px-3"
          >
            {row.deviceId || (
              <span className="text-muted-foreground italic text-xs">—</span>
            )}
          </div>
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

export default function App() {
  const [rows, setRows] = useState<TestRow[]>([initialRow]);
  const [counter, setCounter] = useState(2);
  const { actor } = useActor(createActor);

  // Map of row id → debounce timer ref
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {},
  );

  const handleUpdate = useCallback(
    (id: number, updates: Partial<TestRow>) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      );

      // If the testId field changed, handle TP-prefixed debounce logic
      if ("testId" in updates && updates.testId !== undefined) {
        const newTestId = updates.testId;

        // Clear any existing debounce for this row
        if (debounceTimers.current[id]) {
          clearTimeout(debounceTimers.current[id]);
          delete debounceTimers.current[id];
        }

        if (newTestId.startsWith("TP") && actor) {
          // Mark row as fetching and schedule the call
          setRows((prev) =>
            prev.map((r) =>
              r.id === id ? { ...r, isFetchingDetails: true } : r,
            ),
          );

          debounceTimers.current[id] = setTimeout(async () => {
            try {
              const result = await actor.fetchTestData(newTestId);
              setRows((prev) =>
                prev.map((r) =>
                  r.id === id
                    ? { ...r, details: result, isFetchingDetails: false }
                    : r,
                ),
              );
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              setRows((prev) =>
                prev.map((r) =>
                  r.id === id
                    ? {
                        ...r,
                        details: `API call failed: ${msg}`,
                        isFetchingDetails: false,
                        status: "error",
                      }
                    : r,
                ),
              );
            }
          }, 600);
        } else {
          // Not TP-prefixed — cancel any loading state
          setRows((prev) =>
            prev.map((r) =>
              r.id === id ? { ...r, isFetchingDetails: false } : r,
            ),
          );
        }
      }
    },
    [actor],
  );

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const handleStart = async (id: number) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "running" } : r)),
    );

    try {
      // Use startFetching if available on the actor, otherwise fall back to fetchTestData
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actorAny = actor as any;
      if (actor && typeof actorAny.startFetching === "function") {
        const result: string = await actorAny.startFetching(row.testId);
        setRows((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "completed", results: result } : r,
          ),
        );
      } else if (actor) {
        const result = await actor.fetchTestData(row.testId);
        setRows((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "completed", results: result } : r,
          ),
        );
      } else {
        // Actor not ready — simulate completion
        setTimeout(() => {
          setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: "completed" } : r)),
          );
        }, 3000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "error", results: `Error: ${msg}` } : r,
        ),
      );
    }
  };

  const handleDelete = (id: number) => {
    // Clear any pending debounce for this row
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
      delete debounceTimers.current[id];
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddRow = () => {
    const newRow: TestRow = {
      id: counter,
      testId: `TEST-5G-${String(counter).padStart(3, "0")}`,
      requestType: "UE Capa",
      deviceId: "",
      results: "",
      details:
        "New test configuration pending. Set request type and configure parameters before starting.",
      status: "idle",
    };
    setRows((prev) => [...prev, newRow]);
    setCounter((c) => c + 1);
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

          {/* Test rows */}
          <div data-ocid="test-rows-container" className="flex flex-col gap-3">
            {rows.map((row) => (
              <TestRowCard
                key={row.id}
                row={row}
                onUpdate={handleUpdate}
                onStart={handleStart}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Add row button */}
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
