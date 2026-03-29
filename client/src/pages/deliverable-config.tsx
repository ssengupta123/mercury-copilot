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
import {
  Plus, Trash2, ArrowLeft, FileText, Save, X, Pencil, Download,
} from "lucide-react";
import { Link } from "wouter";
import type { Agent } from "@/lib/types";

const logoPath = "/images/reason-group-logo-horizontal.png";

interface DeliverableTile {
  id: number;
  phaseId: string;
  subPhase: string;
  label: string;
  promptText: string;
  optional: boolean;
  sortOrder: number;
}

export default function DeliverableConfig() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingTile, setEditingTile] = useState<DeliverableTile | null>(null);
  const [formData, setFormData] = useState({
    phaseId: "",
    subPhase: "",
    label: "",
    promptText: "",
    optional: false,
    sortOrder: 0,
  });

  const { data: agents = [] } = useQuery<Agent[]>({ queryKey: ["/api/agents"] });
  const { data: tiles = [], isLoading } = useQuery<DeliverableTile[]>({
    queryKey: ["/api/admin/deliverable-tiles"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/admin/deliverable-tiles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deliverable-tiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliverable-tiles"] });
      resetForm();
      toast({ title: "Tile created" });
    },
    onError: () => toast({ title: "Failed to create tile", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      await apiRequest("PUT", `/api/admin/deliverable-tiles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deliverable-tiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliverable-tiles"] });
      resetForm();
      toast({ title: "Tile updated" });
    },
    onError: () => toast({ title: "Failed to update tile", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/deliverable-tiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deliverable-tiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliverable-tiles"] });
      toast({ title: "Tile deleted" });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/deliverable-tiles/seed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deliverable-tiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliverable-tiles"] });
      toast({ title: `Seeded ${data.seeded} tiles from defaults` });
    },
    onError: () => toast({ title: "Failed to seed tiles", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({ phaseId: "", subPhase: "", label: "", promptText: "", optional: false, sortOrder: 0 });
    setEditingTile(null);
    setShowForm(false);
  };

  const startEdit = (tile: DeliverableTile) => {
    setEditingTile(tile);
    setFormData({
      phaseId: tile.phaseId,
      subPhase: tile.subPhase,
      label: tile.label,
      promptText: tile.promptText,
      optional: tile.optional,
      sortOrder: tile.sortOrder,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.phaseId || !formData.subPhase || !formData.label || !formData.promptText) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (editingTile) {
      updateMutation.mutate({ id: editingTile.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getAgent = (phaseId: string) => agents.find(a => a.id === phaseId);

  const groupedByPhase = agents.map(agent => ({
    agent,
    tiles: tiles.filter(t => t.phaseId === agent.id),
  }));

  const existingSubPhases = [...new Set(tiles.map(t => t.subPhase))];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back-to-admin">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <img src={logoPath} alt="Reason Group" className="h-6 object-contain" />
            <div>
              <h1 className="font-semibold text-sm" data-testid="text-deliverable-config-title">Deliverable Tiles</h1>
              <p className="text-xs text-muted-foreground">Configure the prompt tiles shown for each phase</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tiles.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                data-testid="button-seed-defaults"
              >
                <Download className="w-4 h-4" />
                {seedMutation.isPending ? "Seeding..." : "Load Defaults"}
              </Button>
            )}
            <Button
              onClick={() => { resetForm(); setShowForm(true); }}
              size="sm"
              className="gap-2"
              data-testid="button-add-tile"
            >
              <Plus className="w-4 h-4" />
              Add Tile
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {showForm && (
          <div className="bg-card border border-border rounded-lg p-5 space-y-4" data-testid="tile-form">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{editingTile ? "Edit Tile" : "New Tile"}</h2>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Phase</Label>
                <Select value={formData.phaseId} onValueChange={v => setFormData(f => ({ ...f, phaseId: v }))}>
                  <SelectTrigger data-testid="select-phase">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Sub-Phase / Group</Label>
                <Input
                  value={formData.subPhase}
                  onChange={e => setFormData(f => ({ ...f, subPhase: e.target.value }))}
                  placeholder="e.g. Mobilisation, Initiation, Build"
                  list="subphase-suggestions"
                  data-testid="input-subphase"
                />
                <datalist id="subphase-suggestions">
                  {existingSubPhases.map(sp => (
                    <option key={sp} value={sp} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <Label className="text-xs">Tile Label</Label>
              <Input
                value={formData.label}
                onChange={e => setFormData(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Internal Job Plan — Identify Resources"
                data-testid="input-label"
              />
            </div>

            <div>
              <Label className="text-xs">Prompt Text (sent to bot when clicked)</Label>
              <Textarea
                value={formData.promptText}
                onChange={e => setFormData(f => ({ ...f, promptText: e.target.value }))}
                placeholder="e.g. Help me create an internal job plan to identify and allocate the right resources for our Mercury engagement"
                rows={3}
                data-testid="input-prompt-text"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={e => setFormData(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  data-testid="input-sort-order"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch
                  checked={formData.optional}
                  onCheckedChange={v => setFormData(f => ({ ...f, optional: v }))}
                  data-testid="switch-optional"
                />
                <Label className="text-xs">Optional</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={resetForm} data-testid="button-cancel-tile">Cancel</Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-tile"
              >
                <Save className="w-4 h-4" />
                {editingTile ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : tiles.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No deliverable tiles configured yet.</p>
            <p className="text-xs text-muted-foreground">Click "Load Defaults" to import the standard Mercury tiles, or "Add Tile" to create custom ones.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByPhase.filter(g => g.tiles.length > 0).map(({ agent, tiles: phaseTiles }) => {
              const subPhases = [...new Set(phaseTiles.map(t => t.subPhase))];
              return (
                <div key={agent.id} className="space-y-3" data-testid={`phase-tiles-${agent.id}`}>
                  <div className="flex items-center gap-2 px-1">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: agent.color + "15" }}
                    >
                      <AgentIcon icon={agent.icon} className="w-4 h-4" color={agent.color} />
                    </div>
                    <span className="text-sm font-semibold">{agent.name}</span>
                    <Badge variant="outline" className="text-[10px]">{phaseTiles.length} tiles</Badge>
                  </div>

                  {subPhases.map(sp => {
                    const spTiles = phaseTiles.filter(t => t.subPhase === sp);
                    return (
                      <div key={sp} className="ml-9 space-y-1.5">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{sp}</p>
                        {spTiles.map(tile => (
                          <div
                            key={tile.id}
                            className="flex items-center gap-3 bg-card border border-card-border rounded-lg px-4 py-2.5"
                            data-testid={`tile-card-${tile.id}`}
                          >
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{tile.label}</span>
                                {tile.optional && (
                                  <Badge variant="outline" className="text-[9px]">Optional</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{tile.promptText}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                onClick={() => startEdit(tile)}
                                data-testid={`button-edit-tile-${tile.id}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-destructive"
                                onClick={() => deleteMutation.mutate(tile.id)}
                                data-testid={`button-delete-tile-${tile.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
