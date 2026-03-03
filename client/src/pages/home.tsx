import { useState } from "react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatView } from "@/components/chat-view";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Menu } from "lucide-react";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const handleNewConversation = () => {
    setActiveConversationId(null);
  };

  const handleConversationCreated = (id: number) => {
    setActiveConversationId(id);
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
              onSelectConversation={setActiveConversationId}
              onNewConversation={handleNewConversation}
            />
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-2 border-b border-border bg-background h-12">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-hidden">
            <ChatView
              conversationId={activeConversationId}
              onConversationCreated={handleConversationCreated}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
