interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const html = parseMarkdown(content);
  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseMarkdown(text: string): string {
  const codeBlocks: string[] = [];
  let processed = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, _lang, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre class="bg-muted rounded-md p-3 overflow-x-auto my-3"><code class="text-sm font-mono">${escapeHtml(code.trim())}</code></pre>`);
    return `%%CODEBLOCK_${index}%%`;
  });

  const inlineCode: string[] = [];
  processed = processed.replace(/`([^`]+)`/g, (_match, code) => {
    const index = inlineCode.length;
    inlineCode.push(`<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">${escapeHtml(code)}</code>`);
    return `%%INLINECODE_${index}%%`;
  });

  processed = escapeHtml(processed);

  processed = processed.replace(/%%CODEBLOCK_(\d+)%%/g, (_match, idx) => codeBlocks[parseInt(idx)]);
  processed = processed.replace(/%%INLINECODE_(\d+)%%/g, (_match, idx) => inlineCode[parseInt(idx)]);

  processed = processed.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>');
  processed = processed.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>');
  processed = processed.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>');

  processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');

  processed = processed.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>');
  processed = processed.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$2</li>');

  processed = processed.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="my-2 space-y-1">$1</ul>');

  processed = processed.replace(/\n{2,}/g, '</p><p class="my-2">');
  processed = processed.replace(/\n/g, '<br/>');

  if (!processed.startsWith("<")) {
    processed = `<p class="my-2">${processed}</p>`;
  }

  return processed;
}
