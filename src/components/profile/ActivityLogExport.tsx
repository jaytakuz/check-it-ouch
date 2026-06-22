import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, Inbox, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type ActivityLevel = "Participation" | "Practice" | "Implementation";
type ActivityStatus = "Present" | "Certified" | "Absent" | "Upcoming";

interface ActivityRecord {
  Student_ID: string;
  Full_Name: string;
  Event_Name: string;
  Activity_Level: ActivityLevel;
  Date: string; // DD-MMM-YYYY
  Time_In: string;
  Total_Hours: number;
  Status: ActivityStatus;
  Checksum_Hash: string;
}

// ─────────────────────────────────────────────────────────────
// Mock dataset (the source of truth for this isolated component)
// ─────────────────────────────────────────────────────────────
const MOCK_RECORDS: ActivityRecord[] = [
  {
    Student_ID: "STD-66001",
    Full_Name: "Nattapong Sukjai",
    Event_Name: "AI Ethics Symposium 2026",
    Activity_Level: "Participation",
    Date: "15-Jan-2026",
    Time_In: "09:00 AM",
    Total_Hours: 3,
    Status: "Present",
    Checksum_Hash: "A7X9K2",
  },
  {
    Student_ID: "STD-66001",
    Full_Name: "Nattapong Sukjai",
    Event_Name: "React Advanced Workshop",
    Activity_Level: "Practice",
    Date: "02-Feb-2026",
    Time_In: "01:30 PM",
    Total_Hours: 6,
    Status: "Certified",
    Checksum_Hash: "B3M8N1",
  },
  {
    Student_ID: "STD-66002",
    Full_Name: "Pim Chayanan",
    Event_Name: "Open Source Hackathon",
    Activity_Level: "Implementation",
    Date: "20-Feb-2026",
    Time_In: "08:00 AM",
    Total_Hours: 12,
    Status: "Certified",
    Checksum_Hash: "Q5T4R9",
  },
  {
    Student_ID: "STD-66003",
    Full_Name: "Korn Aphisit",
    Event_Name: "UX Research Bootcamp",
    Activity_Level: "Practice",
    Date: "05-Mar-2026",
    Time_In: "10:15 AM",
    Total_Hours: 4,
    Status: "Present",
    Checksum_Hash: "Z2L7P0",
  },
  {
    Student_ID: "STD-66004",
    Full_Name: "Mint Suphanan",
    Event_Name: "Cloud Native Meetup",
    Activity_Level: "Participation",
    Date: "12-Mar-2026",
    Time_In: "06:00 PM",
    Total_Hours: 2,
    Status: "Absent", // excluded
    Checksum_Hash: "W1Y6F3",
  },
  {
    Student_ID: "STD-66005",
    Full_Name: "Earth Tanawat",
    Event_Name: "Startup Pitch Night",
    Activity_Level: "Implementation",
    Date: "28-Mar-2026",
    Time_In: "07:00 PM",
    Total_Hours: 5,
    Status: "Upcoming", // excluded
    Checksum_Hash: "H8C2V4",
  },
  {
    Student_ID: "STD-66001",
    Full_Name: "Nattapong Sukjai",
    Event_Name: "Data Visualization Lab",
    Activity_Level: "Implementation",
    Date: "10-Apr-2026",
    Time_In: "09:30 AM",
    Total_Hours: 8,
    Status: "Certified",
    Checksum_Hash: "K9D5J7",
  },
];

const FILTER_TABS: ("All" | ActivityLevel)[] = [
  "All",
  "Participation",
  "Practice",
  "Implementation",
];

const levelStyles: Record<ActivityLevel, string> = {
  Participation: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  Practice: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  Implementation: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
};

const statusStyles: Record<"Present" | "Certified", string> = {
  Present: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300",
  Certified: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300",
};

// ─────────────────────────────────────────────────────────────
// CSV helpers (native — no external libs)
// ─────────────────────────────────────────────────────────────
const CSV_HEADERS = [
  "Student_ID",
  "Full_Name",
  "Event_Name",
  "Activity_Level",
  "Date",
  "Time_In",
  "Total_Hours",
  "Checksum_Hash",
] as const;

const escapeCSV = (val: string | number): string => {
  const s = String(val ?? "");
  // Wrap in quotes if value contains comma, quote, or newline
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const buildCSV = (rows: ActivityRecord[]): string => {
  const headerLine = CSV_HEADERS.join(",");
  const bodyLines = rows.map((r) =>
    CSV_HEADERS.map((h) => escapeCSV(r[h as keyof ActivityRecord] as string | number)).join(","),
  );
  // BOM ensures Excel reads UTF-8 cleanly
  return "\uFEFF" + [headerLine, ...bodyLines].join("\n");
};

const downloadCSV = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
interface ActivityLogExportProps {
  records?: ActivityRecord[];
}

const ActivityLogExport = ({ records = MOCK_RECORDS }: ActivityLogExportProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>("All");
  const [isExporting, setIsExporting] = useState(false);

  // Business rule: only Present or Certified are visible/exportable
  const completedRecords = useMemo(
    () => records.filter((r) => r.Status === "Present" || r.Status === "Certified"),
    [records],
  );

  const visibleRecords = useMemo(() => {
    if (activeTab === "All") return completedRecords;
    return completedRecords.filter((r) => r.Activity_Level === activeTab);
  }, [completedRecords, activeTab]);

  const isEmpty = visibleRecords.length === 0;

  const handleExport = () => {
    if (isExporting || isEmpty) return;
    setIsExporting(true);

    // 1500ms debounce to simulate processing & prevent duplicate clicks
    setTimeout(() => {
      const csv = buildCSV(visibleRecords);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCSV(`activity-log-${activeTab.toLowerCase()}-${stamp}.csv`, csv);
      toast.success("Exported successfully", {
        description: `${visibleRecords.length} record${visibleRecords.length === 1 ? "" : "s"} saved as CSV`,
      });
      setIsExporting(false);
    }, 1500);
  };

  return (
    <Card className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Activity Log</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Verified attendance & certified completions
          </p>
        </div>
      </div>

      {/* Filter tabs + Export */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="h-9">
            {FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="text-xs sm:text-sm px-2.5 sm:px-3">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting || isEmpty}
          className={cn(
            "gap-2 border-primary/40 text-primary hover:bg-primary/5 hover:text-primary",
            "transition-all",
          )}
        >
          {isExporting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download size={15} />
              Export Log (CSV)
            </>
          )}
        </Button>
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed rounded-lg bg-muted/30"
          >
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <Inbox className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              No completed activities to export yet.
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Once your attendance is verified or a certificate is issued, your records will appear here.
            </p>
          </motion.div>
        ) : isMobile ? (
          // ── Mobile: stacked cards ─────────────────────────────
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2.5"
          >
            {visibleRecords.map((r, i) => (
              <div
                key={`${r.Student_ID}-${r.Event_Name}-${i}`}
                className="rounded-lg border bg-card p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {r.Event_Name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.Date} · {r.Time_In}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0 text-[10px]", statusStyles[r.Status as "Present" | "Certified"])}>
                    {r.Status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="outline" className={cn("text-[10px]", levelStyles[r.Activity_Level])}>
                    {r.Activity_Level}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {r.Total_Hours}h
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 border-t text-[10px] text-muted-foreground font-mono">
                  <ShieldCheck size={11} />
                  {r.Checksum_Hash}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          // ── Desktop: data table ───────────────────────────────
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs">Student ID</TableHead>
                  <TableHead className="text-xs">Event</TableHead>
                  <TableHead className="text-xs">Level</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Time In</TableHead>
                  <TableHead className="text-xs text-right">Hours</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRecords.map((r, i) => (
                  <TableRow key={`${r.Student_ID}-${r.Event_Name}-${i}`}>
                    <TableCell className="text-xs font-mono">{r.Student_ID}</TableCell>
                    <TableCell className="text-sm font-medium">{r.Event_Name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", levelStyles[r.Activity_Level])}>
                        {r.Activity_Level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{r.Date}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{r.Time_In}</TableCell>
                    <TableCell className="text-xs text-right">{r.Total_Hours}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", statusStyles[r.Status as "Present" | "Certified"])}>
                        {r.Status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck size={11} />
                        {r.Checksum_Hash}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer count */}
      {!isEmpty && (
        <p className="text-xs text-muted-foreground">
          Showing {visibleRecords.length} of {completedRecords.length} completed records
        </p>
      )}
    </Card>
  );
};

export default ActivityLogExport;
