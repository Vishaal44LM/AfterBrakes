import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { SymptomInputs, CONDITION_OPTIONS } from "./types";

interface SymptomCaptureStepProps {
  data: SymptomInputs;
  onChange: (data: SymptomInputs) => void;
}

const SymptomCaptureStep = ({ data, onChange }: SymptomCaptureStepProps) => {
  const toggleSymptom = (id: string) => {
    const updatedSymptoms = data.symptoms.map((s) =>
      s.id === id ? { ...s, selected: !s.selected } : s
    );
    onChange({ ...data, symptoms: updatedSymptoms });
  };

  const toggleCondition = (conditionId: string) => {
    const conditions = data.conditions.includes(conditionId)
      ? data.conditions.filter((c) => c !== conditionId)
      : [...data.conditions, conditionId];
    onChange({ ...data, conditions });
  };

  const getFrequencyValue = () => {
    if (data.frequency === "rare") return 0;
    if (data.frequency === "occasional") return 50;
    return 100;
  };

  const setFrequencyFromSlider = (value: number) => {
    let frequency: SymptomInputs["frequency"] = "occasional";
    if (value < 33) frequency = "rare";
    else if (value > 66) frequency = "frequent";
    onChange({ ...data, frequency });
  };

  const getSeverityValue = () => {
    if (data.severity === "low") return 0;
    if (data.severity === "medium") return 50;
    return 100;
  };

  const setSeverityFromSlider = (value: number) => {
    let severity: SymptomInputs["severity"] = "medium";
    if (value < 33) severity = "low";
    else if (value > 66) severity = "high";
    onChange({ ...data, severity });
  };

  const hasSelectedSymptoms = data.symptoms.some((s) => s.selected);

  return (
    <div className="space-y-8">
      {/* Symptom Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          What issues are you experiencing? <span className="text-muted-foreground">(select all that apply)</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {data.symptoms.map((symptom) => (
            <label
              key={symptom.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                symptom.selected
                  ? "border-primary bg-primary/10"
                  : "border-border/30 bg-secondary/20 hover:bg-secondary/40"
              }`}
            >
              <Checkbox
                checked={symptom.selected}
                onCheckedChange={() => toggleSymptom(symptom.id)}
              />
              <span className="text-sm text-foreground">{symptom.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Only show frequency/severity if symptoms selected */}
      {hasSelectedSymptoms && (
        <>
          {/* Frequency Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">How often does it happen?</Label>
              <span className="text-sm font-medium text-primary capitalize">{data.frequency}</span>
            </div>
            <Slider
              value={[getFrequencyValue()]}
              onValueChange={([value]) => setFrequencyFromSlider(value)}
              min={0}
              max={100}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rare</span>
              <span>Occasional</span>
              <span>Frequent</span>
            </div>
          </div>

          {/* Severity Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">How severe is it?</Label>
              <span className="text-sm font-medium text-primary capitalize">{data.severity}</span>
            </div>
            <Slider
              value={[getSeverityValue()]}
              onValueChange={([value]) => setSeverityFromSlider(value)}
              min={0}
              max={100}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              When does it occur? <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITION_OPTIONS.map((condition) => (
                <label
                  key={condition.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                    data.conditions.includes(condition.id)
                      ? "border-primary bg-primary/10"
                      : "border-border/30 bg-secondary/20 hover:bg-secondary/40"
                  }`}
                >
                  <Checkbox
                    checked={data.conditions.includes(condition.id)}
                    onCheckedChange={() => toggleCondition(condition.id)}
                  />
                  <span className="text-foreground">{condition.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Additional details <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          placeholder="Any other observations? e.g., 'Happens mainly in mornings' or 'Started after a long trip'"
          value={data.additionalNotes}
          onChange={(e) => onChange({ ...data, additionalNotes: e.target.value })}
          className="bg-secondary/30 border-border/30 min-h-[80px]"
          style={{ fontSize: "16px" }}
        />
      </div>
    </div>
  );
};

export default SymptomCaptureStep;
