import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatView } from "@/components/chat-view";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Trash2, ChevronDown, X } from "lucide-react";
import type { Conversation } from "@/lib/types";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [showRecentChats, setShowRecentChats] = useState(false);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setSelectedPhase(null);
    setShowRecentChats(false);
  };

  const handleConversationCreated = (id: number) => {
    setActiveConversationId(id);
    setSelectedPhase(null);
    setShowRecentChats(false);
  };

  const handleSelectConversation = (id: number) => {
    setActiveConversationId(id);
    setSelectedPhase(null);
    setShowRecentChats(false);
  };

  const handleSelectPhase = (phaseId: string | null) => {
    setSelectedPhase(phaseId);
    setActiveConversationId(null);
    setShowRecentChats(false);
  };

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "0rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent className="p-0">
            <ChatSidebar
              activeConversationId={activeConversationId}
              selectedPhase={selectedPhase}
              onNewConversation={handleNewConversation}
              onSelectPhase={handleSelectPhase}
            />
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-2 border-b border-border bg-background h-12">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => setShowRecentChats(!showRecentChats)}
                data-testid="button-recent-chats"
              >
                <MessageSquare className="w-4 h-4" />
                Recent Chats
                {conversations.length > 0 && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{conversations.length}</span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${showRecentChats ? "rotate-180" : ""}`} />
              </Button>

              {showRecentChats && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded-lg shadow-lg z-50" data-testid="recent-chats-dropdown">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Chats</p>
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setShowRecentChats(false)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <ScrollArea className="max-h-72">
                    <div className="p-1">
                      {conversations.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                          No conversations yet.
                        </p>
                      ) : (
                        conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                              activeConversationId === conv.id
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent/50"
                            }`}
                            onClick={() => handleSelectConversation(conv.id)}
                            data-testid={`conversation-item-${conv.id}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="flex-1 text-sm truncate">{conv.title}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(conv.id);
                                if (activeConversationId === conv.id) {
                                  handleNewConversation();
                                }
                              }}
                              data-testid={`button-delete-conversation-${conv.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <ChatView
              conversationId={activeConversationId}
              selectedPhase={selectedPhase}
              onConversationCreated={handleConversationCreated}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
