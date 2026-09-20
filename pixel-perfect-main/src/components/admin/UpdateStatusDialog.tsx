import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HardHat, Info, Printer, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEVERITIES, STATUSES, type ReportStatus, type SeverityLevel } from "@/lib/domain";
import { JobOrderDialog } from "./JobOrderDialog";

export type AdminReport = {
  id: string;
  reference_code: string;
  status: string;
  severity_level: string;
  title: string;
  damage_type?: string;
  road_name?: string;
  barangay?: string;
  latitude?: number;
  longitude?: number;
  priority_score?: number | null;
  created_at?: string;
};

export function UpdateStatusDialog({
  report,
  open,
  onOpenChange,
}: {
  report: AdminReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [showJobOrder, setShowJobOrder] = useState(false);
  const [status, setStatus] = useState<ReportStatus>("under_review");
  const [severity, setSeverity] = useState<SeverityLevel>("low");
  const [assignedCrew, setAssignedCrew] = useState("");
  const [materialsNeeded, setMaterialsNeeded] = useState("");
  const [notes, setNotes] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [initialized, setInitialized] = useState<string | null>(null);

  if (report && initialized !== report.id) {
    setInitialized(report.id);
    setStatus(report.status as ReportStatus);
    setSeverity(report.severity_level as SeverityLevel);
    setNotes("");
    setAssignedCrew("");
    setMaterialsNeeded("");
    setRepairDate("");
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!report) return;
      const { error } = await supabase
        .from("reports")
        .update({ status, severity_level: severity })
        .eq("id", report.id);
      if (error) throw error;

      // Combine structured maintenance task notes
      const taskNotes = [
        assignedCrew.trim() ? `Assigned Crew/Contractor: ${assignedCrew.trim()}` : "",
        materialsNeeded.trim() ? `Materials & Equipment: ${materialsNeeded.trim()}` : "",
        notes.trim() ? `Engineer Findings: ${notes.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      if (taskNotes || repairDate) {
        const { error: updateError } = await supabase.from("maintenance_updates").insert({
          report_id: report.id,
          status,
          engineer_notes: taskNotes || null,
          repair_date: repairDate || null,
        });
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      toast.success("Maintenance task updated and citizen notified.");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Maintenance Task: {report?.reference_code}</DialogTitle>
          <DialogDescription>
            Systematic engineering review and maintenance tracking for {report?.title}.
          </DialogDescription>
        </DialogHeader>

        {/* Limitation 5 Notice */}
        <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong>Manual Operations Protocol (Limitation 5):</strong> This module schedules and tracks
            maintenance tasks. Crew mobilization and heavy equipment dispatch are executed manually
            by the City Engineering Office.
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Workflow Stage</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Verified Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as SeverityLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="repairDate">Scheduled repair date</Label>
              <Input
                id="repairDate"
                type="date"
                value={repairDate}
                onChange={(e) => setRepairDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crew">Assigned Maintenance Crew</Label>
              <Input
                id="crew"
                value={assignedCrew}
                onChange={(e) => setAssignedCrew(e.target.value)}
                placeholder="e.g. Road Maintenance Team Alpha"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materials">Materials & Equipment Allocated</Label>
            <Input
              id="materials"
              value={materialsNeeded}
              onChange={(e) => setMaterialsNeeded(e.target.value)}
              placeholder="e.g. Cold-mix asphalt (5 bags), compactor, barricades"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Engineer Inspection Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Physical measurements, weather factors, traffic control plan, completion verification..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between items-stretch sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowJobOrder(true)}
            className="gap-2 border-primary/30 text-primary hover:bg-primary-soft text-xs"
          >
            <Printer className="size-4" /> Print Job Order (Work Order)
          </Button>
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save Maintenance Record"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {report && (
        <JobOrderDialog
          report={{
            ...report,
            damage_type: report.damage_type || "pothole",
          }}
          open={showJobOrder}
          onOpenChange={setShowJobOrder}
          defaultCrew={assignedCrew}
          defaultRepairDate={repairDate}
          defaultMaterials={materialsNeeded}
          defaultNotes={notes}
        />
      )}
    </Dialog>
  );
}
