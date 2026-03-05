import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, X, FileText, Loader2 } from "lucide-react";

interface UploadedFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

interface ChatInputProps {
  onSend: (message: string, attachments?: UploadedFile[]) => void;
  isLoading: boolean;
  placeholder?: string;
  conversationId?: number | null;
}

export function ChatInput({ onSend, isLoading, placeholder, conversationId }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if ((!trimmed && attachments.length === 0) || isLoading) return;
    const message = attachments.length > 0 && trimmed
      ? `${trimmed}\n\n[Attached files: ${attachments.map(a => a.originalName).join(", ")}]`
      : trimmed || `[Attached files: ${attachments.map(a => a.originalName).join(", ")}]`;
    onSend(message, attachments);
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        if (conversationId) formData.append("conversationId", String(conversationId));

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const doc = await res.json();
        setAttachments(prev => [...prev, doc]);
      }
    } catch {
      console.error("File upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((file, i) => (
              <Badge key={i} variant="secondary" className="gap-1.5 py-1 px-2 text-xs">
                <FileText className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{file.originalName}</span>
                <span className="text-muted-foreground">({formatSize(file.size)})</span>
                <button onClick={() => removeAttachment(i)} className="hover:text-destructive" data-testid={`button-remove-attachment-${i}`}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 bg-card rounded-xl border border-card-border p-2 shadow-sm">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg,.gif"
            data-testid="input-file-upload"
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            data-testid="button-attach-file"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ask Mercury Copilot about your delivery process..."}
            className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 text-sm min-h-[40px] max-h-[160px]"
            rows={1}
            disabled={isLoading}
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSubmit}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            size="icon"
            className="shrink-0"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Mercury Copilot routes your message to the right specialist. Attach documents with the paperclip icon.
        </p>
      </div>
    </div>
  );
}
