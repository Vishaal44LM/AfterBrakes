import { SymptomInputs, SymptomInput, SYMPTOM_OPTIONS, CONDITION_OPTIONS } from "./types";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StepSymptomsProps {
  data: SymptomInputs;
  onChange: (data: SymptomInputs) => void;
}

const frequencyOptions = [
  { id: "rare", label: "Rare" },
  { id: "occasional", label: "Occasional" },
  { id: "frequent", label: "Frequent" },
] as const;

const severityOptions = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
] as const;

const StepSymptoms = ({ data, onChange }: StepSymptomsProps) => {
  const [expandedSymptom, setExpandedSymptom] = useState<string | null>(null);

  const toggleSymptom = (symptomId: string) => {
    const existing = data.symptoms.find(s => s.id === symptomId);
    
    if (existing) {
      // Remove if unchecking
      if (existing.checked) {
        onChange({
          ...data,
          symptoms: data.symptoms.filter(s => s.id !== symptomId)
        });
        if (expandedSymptom === symptomId) setExpandedSymptom(null);
      } else {
        // Toggle checked state
        onChange({
          ...data,
          symptoms: data.symptoms.map(s => 
            s.id === symptomId ? { ...s, checked: !s.checked } : s
          )
        });
      }
    } else {
      // Add new symptom
      const symptomLabel = SYMPTOM_OPTIONS.find(o => o.id === symptomId)?.label || symptomId;
      const newSymptom: SymptomInput = {
        id: symptomId,
        label: symptomLabel,
        checked: true,
        frequency: "occasional",
        severity: "medium",
        conditions: []
      };
      onChange({
        ...data,
        symptoms: [...data.symptoms, newSymptom]
      });
      setExpandedSymptom(symptomId);
    }
  };

  const updateSymptom = (symptomId: string, updates: Partial<SymptomInput>) => {
    onChange({
      ...data,
      symptoms: data.symptoms.map(s =>
        s.id === symptomId ? { ...s, ...updates } : s
      )
    });
  };

  const toggleCondition = (symptomId: string, conditionId: string) => {
    const symptom = data.symptoms.find(s => s.id === symptomId);
    if (!symptom) return;

    const newConditions = symptom.conditions.includes(conditionId)
      ? symptom.conditions.filter(c => c !== conditionId)
      : [...symptom.conditions, conditionId];

    updateSymptom(symptomId, { conditions: newConditions });
  };

  const getSymptomData = (symptomId: string) => {
    return data.symptoms.find(s => s.id === symptomId);
  };

  const checkedSymptoms = data.symptoms.filter(s => s.checked);

  return (
    <div className="space-y-6">
      {/* Symptom checkboxes */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm text-foreground">
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
          Select any symptoms you've noticed
        </Label>
        <p className="text-xs text-muted-foreground">
          Symptoms are optional but help improve prediction accuracy significantly.
        </p>
        
        <div className="space-y-2">
          {SYMPTOM_OPTIONS.map((option) => {
            const symptomData = getSymptomData(option.id);
            const isChecked = symptomData?.checked ?? false;
            const isExpanded = expandedSymptom === option.id;

            return (
              <div key={option.id} className="space-y-2">
                <div
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                    isChecked
                      ? "border-primary bg-primary/10"
                      : "border-border/40 bg-secondary/20 hover:border-border"
                  )}
                  onClick={() => toggleSymptom(option.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSymptom(option.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={cn(
                      "text-sm",
                      isChecked ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                  </div>
                  {isChecked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSymptom(isExpanded ? null : option.id);
                      }}
                      className="p-1 hover:bg-secondary/50 rounded"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded details */}
                {isChecked && isExpanded && symptomData && (
                  <div className="ml-4 pl-4 border-l-2 border-primary/30 space-y-4 animate-fade-slide-up">
                    {/* Frequency */}
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Frequency</span>
                      <div className="flex gap-2">
                        {frequencyOptions.map((freq) => (
                          <button
                            key={freq.id}
                            onClick={() => updateSymptom(option.id, { frequency: freq.id })}
                            className={cn(
                              "px-3 py-1.5 text-xs rounded-full border transition-all",
                              symptomData.frequency === freq.id
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border/40 text-muted-foreground hover:border-border"
                            )}
                          >
                            {freq.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Severity */}
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Severity</span>
                      <div className="flex gap-2">
                        {severityOptions.map((sev) => (
                          <button
                            key={sev.id}
                            onClick={() => updateSymptom(option.id, { severity: sev.id })}
                            className={cn(
                              "px-3 py-1.5 text-xs rounded-full border transition-all",
                              symptomData.severity === sev.id
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border/40 text-muted-foreground hover:border-border"
                            )}
                          >
                            {sev.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Conditions */}
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">When does it happen?</span>
                      <div className="flex flex-wrap gap-2">
                        {CONDITION_OPTIONS.map((cond) => (
                          <button
                            key={cond.id}
                            onClick={() => toggleCondition(option.id, cond.id)}
                            className={cn(
                              "px-3 py-1.5 text-xs rounded-full border transition-all",
                              symptomData.conditions.includes(cond.id)
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border/40 text-muted-foreground hover:border-border"
                            )}
                          >
                            {cond.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary of selected symptoms */}
      {checkedSymptoms.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
          <span className="text-xs text-muted-foreground">
            {checkedSymptoms.length} symptom{checkedSymptoms.length !== 1 ? 's' : ''} selected
            <span className="text-green-500 ml-2">+25% input strength</span>
          </span>
        </div>
      )}

      {/* Optional additional notes */}
      <div className="space-y-2">
        <Label className="text-sm text-foreground">
          Additional notes (optional)
        </Label>
        <Textarea
          placeholder="Any other observations you'd like to mention..."
          value={data.additionalNotes}
          onChange={(e) => onChange({ ...data, additionalNotes: e.target.value })}
          className="bg-secondary/30 border-border/40 min-h-[80px]"
        />
      </div>
    </div>
  );
};

export default StepSymptoms;
