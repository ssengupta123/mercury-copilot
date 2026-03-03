import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentIcon } from "@/components/agent-icon";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/Reason_Group_Logo_Stacked_CMYK_(1)_1772514975025.png";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Bot,
  Settings,
  Save,
  X,
} from "lucide-react";
import { Link } from "wouter";
import type { Agent } from "@/lib/types";

interface CopilotBot {
  id: number;
  name: string;
  phaseId: string;
  skillRole: string;
  botEndpoint: string;
  hasSecret: boolean;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SKILL_ROLES = [
  { value: "business-analyst", label: "Business Analyst" },
  { value: "architect", label: "Solution Architect" },
  { value: "data-engineer", label: "Data Engineer" },
  { value: "tech-lead", label: "Tech Lead / Developer" },
  { value: "tester", label: "Tester / QA" },
  { value: "business-consultant", label: "Business Consultant" },
  { value: "rules-expert", label: "Business Rules Expert" },
  { value: "ux-designer", label: "UX / CX Designer" },
  { value: "change-manager", label: "Change Manager" },
  { value: "project-coordinator", label: "Project Coordinator" },
  { value: "custom", label: "Custom Role" },
];

export default function Admin() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingBot, setEditingBot] = useState<CopilotBot | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phaseId: "",
    skillRole: "",
    botEndpoint: "",
    botSecret: "",
    description: "",
    isActive: true,
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: bots = [], isLoading } = useQuery<CopilotBot[]>({
    queryKey: ["/api/admin/copilot-bots"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/admin/copilot-bots", {
        ...data,
        botSecret: data.botSecret || null,
        description: data.description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/copilot-bots"] });
      resetForm();
      toast({ title: "Bot added", description: "Copilot bot configuration saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save bot configuration.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const payload = { ...data };
      if (!payload.botSecret) {
        delete payload.botSecret;
      }
      await apiRequest("PATCH", `/api/admin/copilot-bots/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/copilot-bots"] });
      resetForm();
      toast({ title: "Bot updated", description: "Copilot bot configuration updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update bot configuration.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/copilot-bots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/copilot-bots"] });
      toast({ title: "Bot removed", description: "Copilot bot configuration deleted." });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/admin/copilot-bots/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/copilot-bots"] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingBot(null);
    setFormData({ name: "", phaseId: "", skillRole: "", botEndpoint: "", botSecret: "", description: "", isActive: true });
  };

  const startEdit = (bot: CopilotBot) => {
    setEditingBot(bot);
    setFormData({
      name: bot.name,
      phaseId: bot.phaseId,
      skillRole: bot.skillRole,
      botEndpoint: bot.botEndpoint,
      botSecret: "",
      description: bot.description || "",
      isActive: bot.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phaseId || !formData.skillRole || !formData.botEndpoint) {
      toast({ title: "Validation error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (editingBot) {
      updateMutation.mutate({ id: editingBot.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getPhaseAgent = (phaseId: string) => agents.find(a => a.id === phaseId);
  const getRoleLabel = (role: string) => SKILL_ROLES.find(r => r.value === role)?.label || role;

  const botsByPhase = agents.map(agent => ({
    agent,
    bots: bots.filter(b => b.phaseId === agent.id),
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-to-chat">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <img src={logoPath} alt="Reason Group" className="w-8 h-8 rounded object-cover" />
            <div>
              <h1 className="font-semibold text-sm" data-testid="text-admin-title">Mercury Copilot Admin</h1>
              <p className="text-xs text-muted-foreground">Copilot Studio Bot Configuration</p>
            </div>
          </div>
          <Button
            onClick={() => { resetForm(); setShowForm(true); }}
            size="sm"
            className="gap-2"
            data-testid="button-add-bot"
          >
            <Plus className="w-4 h-4" />
            Add Bot
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {showForm && (
          <div className="mb-6 bg-card border border-card-border rounded-lg p-5" data-testid="form-bot-config">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {editingBot ? "Edit Bot Configuration" : "Add Copilot Studio Bot"}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm} data-testid="button-close-form">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bot Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Discovery BA Copilot"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    data-testid="input-bot-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phase">Mercury Phase *</Label>
                  <Select value={formData.phaseId} onValueChange={v => setFormData(f => ({ ...f, phaseId: v }))}>
                    <SelectTrigger data-testid="select-phase">
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} ({a.weekRange})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skillRole">Skill Role *</Label>
                  <Select value={formData.skillRole} onValueChange={v => setFormData(f => ({ ...f, skillRole: v }))}>
                    <SelectTrigger data-testid="select-skill-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="botEndpoint">Bot Endpoint URL *</Label>
                  <Input
                    id="botEndpoint"
                    placeholder="https://directline.botframework.com/v3/directline/..."
                    value={formData.botEndpoint}
                    onChange={e => setFormData(f => ({ ...f, botEndpoint: e.target.value }))}
                    data-testid="input-bot-endpoint"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="botSecret">Bot Secret (optional)</Label>
                  <Input
                    id="botSecret"
                    type="password"
                    placeholder={editingBot ? "Leave blank to keep existing secret" : "Direct Line secret or API key"}
                    value={formData.botSecret}
                    onChange={e => setFormData(f => ({ ...f, botSecret: e.target.value }))}
                    data-testid="input-bot-secret"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={v => setFormData(f => ({ ...f, isActive: v }))}
                      data-testid="switch-bot-active"
                    />
                    <span className="text-sm">{formData.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does this bot specialise in? e.g. Helps with requirements gathering, user story writing, and acceptance criteria definition."
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  data-testid="input-bot-description"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-bot"
                >
                  <Save className="w-4 h-4" />
                  {editingBot ? "Update Bot" : "Save Bot"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading configurations...</div>
        ) : bots.length === 0 && !showForm ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Bot className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" data-testid="text-empty-state">No Copilot Bots Configured</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Add Microsoft Copilot Studio bots for each Mercury phase and skill role. The orchestrator will route users to the right specialist bot based on their query.
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2" data-testid="button-add-first-bot">
              <Plus className="w-4 h-4" />
              Add Your First Bot
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {botsByPhase.map(({ agent, bots: phaseBots }) => (
              <div key={agent.id} className="space-y-2" data-testid={`phase-section-${agent.id}`}>
                <div className="flex items-center gap-2 px-1">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: agent.color + "15" }}>
                    <AgentIcon icon={agent.icon} className="w-3.5 h-3.5" color={agent.color} />
                  </div>
                  <h3 className="text-sm font-semibold">{agent.name}</h3>
                  <Badge variant="secondary" className="text-[10px]">{agent.phase} · {agent.weekRange}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {phaseBots.length} bot{phaseBots.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {phaseBots.length === 0 ? (
                  <div className="border border-dashed border-border rounded-lg px-4 py-3 text-xs text-muted-foreground">
                    No bots configured for this phase. Click "Add Bot" to assign a Copilot Studio bot.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {phaseBots.map(bot => (
                      <div
                        key={bot.id}
                        className="flex items-center gap-3 bg-card border border-card-border rounded-lg px-4 py-3"
                        data-testid={`bot-card-${bot.id}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{bot.name}</span>
                            <Badge variant={bot.isActive ? "default" : "secondary"} className="text-[10px]">
                              {bot.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{getRoleLabel(bot.skillRole)}</span>
                            {bot.description && (
                              <>
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="text-xs text-muted-foreground truncate">{bot.description}</span>
                              </>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{bot.botEndpoint}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch
                            checked={bot.isActive}
                            onCheckedChange={v => toggleMutation.mutate({ id: bot.id, isActive: v })}
                            data-testid={`switch-toggle-${bot.id}`}
                          />
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => startEdit(bot)} data-testid={`button-edit-${bot.id}`}>
                            <Settings className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => deleteMutation.mutate(bot.id)} data-testid={`button-delete-${bot.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
