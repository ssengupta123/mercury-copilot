import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AgentIcon } from "@/components/agent-icon";
import { useToast } from "@/hooks/use-toast";
const logoPath = "/images/reason-group-logo-horizontal.png";
import {
  ArrowLeft,
  Save,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  FileText,
  RotateCcw,
} from "lucide-react";
import { Link } from "wouter";
import type { Agent } from "@/lib/types";

interface PhaseConfig {
  id: number;
  phaseId: string;
  systemPrompt: string;
  deliverables: string[];
  keywords: string[];
  description: string;
  weekRange: string;
  updatedAt: string | null;
}

export default function PhaseConfigPage() {
  const { toast } = useToast();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<PhaseConfig>>>({});
  const [newDeliverable, setNewDeliverable] = useState<Record<string, string>>({});
  const [newKeyword, setNewKeyword] = useState<Record<string, string>>({});

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: configs = [], isLoading } = useQuery<PhaseConfig[]>({
    queryKey: ["/api/admin/phase-configs"],
  });

  const saveMutation = useMutation({
    mutationFn: async ({ phaseId, data }: { phaseId: string; data: Partial<PhaseConfig> }) => {
      await apiRequest("PUT", `/api/admin/phase-configs/${phaseId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phase-configs"] });
      toast({ title: "Saved", description: "Phase configuration updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save phase configuration.", variant: "destructive" });
    },
  });

  const getEditData = (phaseId: string): PhaseConfig => {
    const config = configs.find(c => c.phaseId === phaseId);
    const edits = editData[phaseId];
    if (!config) return { id: 0, phaseId, systemPrompt: "", deliverables: [], keywords: [], description: "", weekRange: "", updatedAt: null };
    return { ...config, ...edits };
  };

  const updateField = (phaseId: string, field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [phaseId]: { ...prev[phaseId], [field]: value },
    }));
  };

  const addDeliverable = (phaseId: string) => {
    const text = newDeliverable[phaseId]?.trim();
    if (!text) return;
    const current = getEditData(phaseId);
    updateField(phaseId, "deliverables", [...current.deliverables, text]);
    setNewDeliverable(prev => ({ ...prev, [phaseId]: "" }));
  };

  const removeDeliverable = (phaseId: string, index: number) => {
    const current = getEditData(phaseId);
    updateField(phaseId, "deliverables", current.deliverables.filter((_, i) => i !== index));
  };

  const addKeyword = (phaseId: string) => {
    const text = newKeyword[phaseId]?.trim();
    if (!text) return;
    const current = getEditData(phaseId);
    updateField(phaseId, "keywords", [...current.keywords, text]);
    setNewKeyword(prev => ({ ...prev, [phaseId]: "" }));
  };

  const removeKeyword = (phaseId: string, index: number) => {
    const current = getEditData(phaseId);
    updateField(phaseId, "keywords", current.keywords.filter((_, i) => i !== index));
  };

  const handleSave = (phaseId: string) => {
    const data = getEditData(phaseId);
    saveMutation.mutate({
      phaseId,
      data: {
        systemPrompt: data.systemPrompt,
        deliverables: data.deliverables,
        keywords: data.keywords,
        description: data.description,
        weekRange: data.weekRange,
      },
    });
  };

  const handleReset = (phaseId: string) => {
    setEditData(prev => {
      const next = { ...prev };
      delete next[phaseId];
      return next;
    });
    toast({ title: "Reset", description: "Changes discarded. Showing saved configuration." });
  };

  const getAgent = (phaseId: string) => agents.find(a => a.id === phaseId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back-to-admin">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <img src={logoPath} alt="Reason Group" className="h-6 object-contain" />
            <div>
              <h1 className="font-semibold text-sm" data-testid="text-phase-config-title">Phase Configuration</h1>
              <p className="text-xs text-muted-foreground">Configure prompts, deliverables, and keywords per phase</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading configurations...</div>
        ) : (
          <div className="space-y-3">
            {configs.map(config => {
              const agent = getAgent(config.phaseId);
              const isExpanded = expandedPhase === config.phaseId;
              const data = getEditData(config.phaseId);
              const hasEdits = !!editData[config.phaseId];

              return (
                <div
                  key={config.phaseId}
                  className="bg-card border border-card-border rounded-lg overflow-hidden"
                  data-testid={`phase-config-${config.phaseId}`}
                >
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                    onClick={() => setExpandedPhase(isExpanded ? null : config.phaseId)}
                    data-testid={`button-expand-${config.phaseId}`}
                  >
                    {agent && (
                      <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: agent.color + "15" }}>
                        <AgentIcon icon={agent.icon} className="w-4 h-4" color={agent.color} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{agent?.name || config.phaseId}</span>
                        <Badge variant="secondary" className="text-[10px]">{agent?.phase} · {data.weekRange}</Badge>
                        {hasEdits && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Unsaved</Badge>}
                        {config.id > 0 && <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">Customised</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{data.description}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border px-4 py-4 space-y-5">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={data.description}
                          onChange={e => updateField(config.phaseId, "description", e.target.value)}
                          data-testid={`input-description-${config.phaseId}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Week Range</Label>
                        <Input
                          value={data.weekRange}
                          onChange={e => updateField(config.phaseId, "weekRange", e.target.value)}
                          placeholder="e.g. Week 1, Weeks 2-3"
                          data-testid={`input-week-range-${config.phaseId}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>System Prompt</Label>
                        <Textarea
                          value={data.systemPrompt}
                          onChange={e => updateField(config.phaseId, "systemPrompt", e.target.value)}
                          rows={10}
                          className="font-mono text-xs"
                          data-testid={`textarea-prompt-${config.phaseId}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Deliverables</Label>
                        <div className="space-y-1.5">
                          {data.deliverables.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 bg-muted/50 rounded px-3 py-1.5">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm flex-1">{d}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6"
                                onClick={() => removeDeliverable(config.phaseId, i)}
                                data-testid={`button-remove-deliverable-${config.phaseId}-${i}`}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a deliverable..."
                            value={newDeliverable[config.phaseId] || ""}
                            onChange={e => setNewDeliverable(prev => ({ ...prev, [config.phaseId]: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDeliverable(config.phaseId); } }}
                            data-testid={`input-new-deliverable-${config.phaseId}`}
                          />
                          <Button variant="outline" size="sm" onClick={() => addDeliverable(config.phaseId)} data-testid={`button-add-deliverable-${config.phaseId}`}>
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Keywords (used for routing)</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {data.keywords.map((k, i) => (
                            <Badge key={i} variant="secondary" className="gap-1 text-xs pr-1">
                              {k}
                              <button
                                onClick={() => removeKeyword(config.phaseId, i)}
                                className="ml-0.5 hover:text-destructive"
                                data-testid={`button-remove-keyword-${config.phaseId}-${i}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a keyword..."
                            value={newKeyword[config.phaseId] || ""}
                            onChange={e => setNewKeyword(prev => ({ ...prev, [config.phaseId]: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(config.phaseId); } }}
                            data-testid={`input-new-keyword-${config.phaseId}`}
                          />
                          <Button variant="outline" size="sm" onClick={() => addKeyword(config.phaseId)} data-testid={`button-add-keyword-${config.phaseId}`}>
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReset(config.phaseId)}
                          className="gap-1.5"
                          data-testid={`button-reset-${config.phaseId}`}
                        >
                          <RotateCcw className="w-3 h-3" /> Discard Changes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(config.phaseId)}
                          disabled={saveMutation.isPending}
                          className="gap-1.5"
                          data-testid={`button-save-${config.phaseId}`}
                        >
                          <Save className="w-3 h-3" /> Save Configuration
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
