import { useState } from "react";
import {
  FileText,
  HardHat,
  MapPin,
  Printer,
  ShieldCheck,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { damageLabel, statusLabel } from "@/lib/domain";

export interface JobOrderReport {
  id: string;
  reference_code: string;
  title: string;
  status: string;
  severity_level: string;
  damage_type: string;
  road_name?: string;
  barangay?: string;
  latitude?: number;
  longitude?: number;
  priority_score?: number | null;
  created_at?: string;
  description?: string;
}

interface JobOrderDialogProps {
  report: JobOrderReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCrew?: string;
  defaultRepairDate?: string;
  defaultMaterials?: string;
  defaultNotes?: string;
}

export function JobOrderDialog({
  report,
  open,
  onOpenChange,
  defaultCrew = "City Engineering - Road Maintenance Crew Alpha",
  defaultRepairDate,
  defaultMaterials = "Cold-mix asphalt patch (10 bags), bitumen tack coat emulsion, 2 safety barricades",
  defaultNotes,
}: JobOrderDialogProps) {
  const [crew, setCrew] = useState(defaultCrew);
  const [foreman, setForeman] = useState("Engr. L. Balagapo (Foreman)");
  const [scheduledDate, setScheduledDate] = useState(
    defaultRepairDate || new Date().toISOString().split("T")[0]
  );
  const [materials, setMaterials] = useState(defaultMaterials);
  const [equipment, setEquipment] = useState("Vibratory plate compactor, dump truck #4, pavement cut-saw, hand tamping tools");
  const [workScope, setWorkScope] = useState(
    defaultNotes || "Excavate damaged asphalt edges to sound pavement. Clean debris, apply tack coat, lay and compact bituminous patch flush to existing road grade."
  );

  if (!report) return null;

  const jobOrderNumber = `JO-CEO-${new Date().getFullYear()}-${report.reference_code.replace("#", "")}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <FileText className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-lg">City Engineering Job Order</DialogTitle>
                <DialogDescription>
                  Official physical work order slip for manual maintenance crew dispatch (Limitation 5).
                </DialogDescription>
              </div>
            </div>
            <Button onClick={handlePrint} className="gap-2 shadow-sm font-semibold">
              <Printer className="size-4" /> Print / Save PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Customization Form Accordion for Pre-Print Customization */}
        <div className="print:hidden rounded-2xl border border-border bg-secondary/30 p-4 text-xs space-y-3">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Wrench className="size-3.5 text-primary" /> Edit Work Order Details before Printing:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px]">Assigned Maintenance Crew</Label>
              <Input
                className="h-8 text-xs mt-1"
                value={crew}
                onChange={(e) => setCrew(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[11px]">Foreman / Supervisor</Label>
              <Input
                className="h-8 text-xs mt-1"
                value={foreman}
                onChange={(e) => setForeman(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[11px]">Scheduled Repair Date</Label>
              <Input
                type="date"
                className="h-8 text-xs mt-1"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px]">Allocated Equipment</Label>
              <Input
                className="h-8 text-xs mt-1"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[11px]">Allocated Materials</Label>
              <Input
                className="h-8 text-xs mt-1"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-[11px]">Remediation Scope & Instructions</Label>
            <Textarea
              className="text-xs mt-1 min-h-[50px]"
              value={workScope}
              onChange={(e) => setWorkScope(e.target.value)}
            />
          </div>
        </div>

        {/* PRINTABLE OFFICIAL JOB ORDER SLIP */}
        <div id="printable-job-order" className="rounded-2xl border-2 border-border bg-white text-black p-6 sm:p-8 font-sans print:border-black print:p-8 print:m-0 shadow-sm">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 text-center">
            <p className="text-[11px] font-serif uppercase tracking-widest text-neutral-600">
              Republic of the Philippines · Province of Eastern Samar
            </p>
            <h1 className="font-serif text-lg sm:text-xl font-extrabold uppercase tracking-wide text-neutral-900 mt-0.5">
              City Government of Borongan
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Office of the City Engineer — Road Maintenance & Infrastructure Division
            </p>
            <div className="mt-3 inline-block bg-neutral-900 text-white px-4 py-1 rounded text-xs font-mono font-bold tracking-widest uppercase">
              Official Road Maintenance Job Order (Work Order)
            </div>
          </div>

          {/* Document Reference Info */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-b pb-3 border-neutral-300">
            <div>
              <span className="text-neutral-500 font-medium">Job Order No:</span>
              <p className="font-mono font-bold text-neutral-900">{jobOrderNumber}</p>
            </div>
            <div>
              <span className="text-neutral-500 font-medium">Citizen Report Ref:</span>
              <p className="font-mono font-bold text-neutral-900">{report.reference_code}</p>
            </div>
            <div>
              <span className="text-neutral-500 font-medium">Date Issued:</span>
              <p className="font-semibold text-neutral-900">{new Date().toLocaleDateString("en-PH")}</p>
            </div>
            <div>
              <span className="text-neutral-500 font-medium">Scheduled Work Date:</span>
              <p className="font-bold text-neutral-900 text-primary-dark">
                {scheduledDate ? new Date(scheduledDate).toLocaleDateString("en-PH") : "Immediate"}
              </p>
            </div>
          </div>

          {/* Location & Defect Information */}
          <div className="mt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 p-1.5 rounded">
              1. Incident Location & Defect Assessment
            </h2>
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-neutral-500">Road / Street:</span>
                <p className="font-bold text-neutral-900">{report.road_name || "Unspecified Road"}</p>
              </div>
              <div>
                <span className="text-neutral-500">Barangay:</span>
                <p className="font-bold text-neutral-900">{report.barangay || "Borongan City"}</p>
              </div>
              <div>
                <span className="text-neutral-500">GPS Coordinates:</span>
                <p className="font-mono text-[11px] font-semibold text-neutral-800">
                  {report.latitude?.toFixed(6) ?? "11.608000"}° N, {report.longitude?.toFixed(6) ?? "125.432000"}° E
                </p>
              </div>
              <div>
                <span className="text-neutral-500">Damage Classification:</span>
                <p className="font-bold text-neutral-900">{damageLabel(report.damage_type)}</p>
              </div>
              <div>
                <span className="text-neutral-500">Severity Assessment:</span>
                <p className="font-bold capitalize text-neutral-900">
                  {report.severity_level} (Priority Index: {report.priority_score ?? "N/A"}/100)
                </p>
              </div>
              <div>
                <span className="text-neutral-500">Current Workflow Stage:</span>
                <p className="font-bold text-neutral-900">{statusLabel(report.status)}</p>
              </div>
            </div>
          </div>

          {/* Resource Dispatch & Requisition */}
          <div className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 p-1.5 rounded">
              2. Crew Mobilization & Resource Allocation (Manual Dispatch Protocol)
            </h2>
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border border-neutral-200 rounded p-2.5">
                <span className="text-neutral-500 font-medium">Assigned Maintenance Team:</span>
                <p className="font-bold text-neutral-900 mt-0.5">{crew}</p>
                <span className="text-neutral-500 font-medium block mt-2">Lead Foreman / In-Charge:</span>
                <p className="font-bold text-neutral-900 mt-0.5">{foreman}</p>
              </div>
              <div className="border border-neutral-200 rounded p-2.5">
                <span className="text-neutral-500 font-medium">Mobilized Heavy & Hand Equipment:</span>
                <p className="font-medium text-neutral-800 mt-0.5">{equipment}</p>
                <span className="text-neutral-500 font-medium block mt-2">Allocated Materials / Requisition:</span>
                <p className="font-medium text-neutral-800 mt-0.5">{materials}</p>
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 p-1.5 rounded">
              3. Scope of Work & Engineering Specifications
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-neutral-800 p-2.5 border border-neutral-200 rounded bg-neutral-50/50">
              {workScope}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-500 italic">
              <span>* Standard Operating Procedure: Install safety warning devices & flagmen before commencing road excavation.</span>
            </div>
          </div>

          {/* Signatures Block */}
          <div className="mt-8 pt-4 border-t-2 border-neutral-300">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="h-10 border-b border-black"></div>
                <p className="mt-1 text-[11px] font-bold text-neutral-900 uppercase">Field Inspection Engineer</p>
                <p className="text-[10px] text-neutral-500">Prepared & Inspected</p>
              </div>
              <div>
                <div className="h-10 border-b border-black"></div>
                <p className="mt-1 text-[11px] font-bold text-neutral-900 uppercase">City Engineer / Division Head</p>
                <p className="text-[10px] text-neutral-500">Approved for Dispatch</p>
              </div>
              <div>
                <div className="h-10 border-b border-black"></div>
                <p className="mt-1 text-[11px] font-bold text-neutral-900 uppercase">Maintenance Crew Foreman</p>
                <p className="text-[10px] text-neutral-500">Received & Work Executed</p>
              </div>
            </div>
          </div>

          {/* Footer Barcode / Disclaimer */}
          <div className="mt-6 pt-2 border-t text-[10px] text-neutral-400 flex justify-between items-center">
            <span>Borongan RoadWatch Management System · ISO 25010 Evaluated</span>
            <span className="font-mono">DISPATCH-PROTOCOL-SOP-V1</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
