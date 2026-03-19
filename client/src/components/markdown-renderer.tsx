interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const html = parseMarkdown(content);
  return (
    <div
      className={`markdown-body prose prose-sm dark:prose-invert max-w-none ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid="text-markdown-content"
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

function sanitizeUrl(url: string): string {
  const decoded = url.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const trimmed = decoded.trim().toLowerCase();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#")
  ) {
    return url;
  }
  return "#";
}

function parseMarkdown(text: string): string {
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

  const codeBlocks: string[] = [];
  let processed = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const index = codeBlocks.length;
    const langLabel = lang ? `<div class="text-xs text-muted-foreground mb-1 font-mono">${escapeHtml(lang)}</div>` : "";
    codeBlocks.push(`<pre class="bg-muted rounded-md p-3 overflow-x-auto my-3">${langLabel}<code class="text-sm font-mono">${escapeHtml(code.trim())}</code></pre>`);
    return `\n%%CODEBLOCK_${index}%%\n`;
  });

  const inlineCode: string[] = [];
  processed = processed.replace(/`([^`]+)`/g, (_match, code) => {
    const index = inlineCode.length;
    inlineCode.push(`<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">${escapeHtml(code)}</code>`);
    return `%%INLINECODE_${index}%%`;
  });

  processed = escapeHtml(processed);

  processed = processed.replace(/^\[(\d+)\]:\s*cite:\d+\s*&quot;.*?&quot;$/gm, "");

  processed = parseTable(processed);

  processed = processed.replace(/^---+$/gm, '<hr class="my-4 border-border" />');

  processed = processed.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-5 mb-2">$1</h3>');
  processed = processed.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>');
  processed = processed.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-5 mb-2">$1</h1>');

  processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');

  processed = processed.replace(/\[(\d+)\]/g, '<sup class="text-xs text-primary cursor-help">[$1]</sup>');

  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
    const safeUrl = sanitizeUrl(url);
    return `<a href="${safeUrl}" class="text-primary underline" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  processed = parseListBlocks(processed);

  processed = processed.replace(/%%CODEBLOCK_(\d+)%%/g, (_match, idx) => codeBlocks[parseInt(idx)]);
  processed = processed.replace(/%%INLINECODE_(\d+)%%/g, (_match, idx) => inlineCode[parseInt(idx)]);

  processed = processed.replace(/\n{2,}/g, '</p><p class="my-2">');
  processed = processed.replace(/\n/g, '<br/>');

  processed = processed.replace(/<br\/>\s*(<h[123])/g, '$1');
  processed = processed.replace(/(<\/h[123]>)\s*<br\/>/g, '$1');
  processed = processed.replace(/<br\/>\s*(<hr\s)/g, '$1');
  processed = processed.replace(/(<\/hr>|"\s*\/>)\s*<br\/>/g, '$1');
  processed = processed.replace(/<br\/>\s*(<ul|<ol)/g, '$1');
  processed = processed.replace(/(<\/ul>|<\/ol>)\s*<br\/>/g, '$1');
  processed = processed.replace(/<br\/>\s*(<table)/g, '$1');
  processed = processed.replace(/(<\/table>)\s*<br\/>/g, '$1');
  processed = processed.replace(/<br\/>\s*(<pre)/g, '$1');
  processed = processed.replace(/(<\/pre>)\s*<br\/>/g, '$1');

  processed = processed.replace(/<p class="my-2">\s*<\/p>/g, '');

  if (!processed.startsWith("<")) {
    processed = `<p class="my-2">${processed}</p>`;
  }

  return processed;
}

function parseTable(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    if (isTableRow(lines[i]) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headerLine = lines[i];
      i += 2;

      const headers = parseTableCells(headerLine);
      let tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-border text-sm">';
      tableHtml += '<thead><tr class="bg-muted">';
      for (const h of headers) {
        tableHtml += `<th class="border border-border px-3 py-2 text-left font-semibold">${h}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';

      while (i < lines.length && isTableRow(lines[i])) {
        const cells = parseTableCells(lines[i]);
        tableHtml += '<tr class="hover:bg-muted/50">';
        for (let c = 0; c < headers.length; c++) {
          tableHtml += `<td class="border border-border px-3 py-2">${cells[c] || ""}</td>`;
        }
        tableHtml += '</tr>';
        i++;
      }

      tableHtml += '</tbody></table></div>';
      result.push(tableHtml);
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join("\n");
}

function isTableRow(line: string): boolean {
  if (!line) return false;
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.split("|").length >= 3;
}

function isTableSeparator(line: string): boolean {
  if (!line) return false;
  const trimmed = line.trim();
  return /^\|[\s\-:|]+\|$/.test(trimmed);
}

function parseTableCells(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
}

function parseListBlocks(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const ulMatch = lines[i].match(/^(\s*)[-*] (.+)$/);
    const olMatch = lines[i].match(/^(\s*)(\d+)\. (.+)$/);

    if (ulMatch || olMatch) {
      const listLines: string[] = [];
      while (i < lines.length) {
        const ul = lines[i].match(/^(\s*)[-*] (.+)$/);
        const ol = lines[i].match(/^(\s*)(\d+)\. (.+)$/);
        if (ul || ol) {
          listLines.push(lines[i]);
          i++;
        } else if (lines[i].match(/^\s+\S/) && listLines.length > 0) {
          listLines[listLines.length - 1] += " " + lines[i].trim();
          i++;
        } else {
          break;
        }
      }
      result.push(buildList(listLines, 0).html);
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join("\n");
}

function buildList(lines: string[], fromIndex: number): { html: string; nextIndex: number } {
  if (fromIndex >= lines.length) return { html: "", nextIndex: fromIndex };

  const firstUl = lines[fromIndex].match(/^(\s*)[-*] (.+)$/);
  const firstOl = lines[fromIndex].match(/^(\s*)(\d+)\. (.+)$/);
  const baseIndent = (firstUl || firstOl)?.[1]?.length || 0;
  const isOrdered = !!firstOl;
  const tag = isOrdered ? "ol" : "ul";
  const listClass = isOrdered ? "list-decimal" : "list-disc";

  let html = `<${tag} class="my-2 ml-4 space-y-1 ${listClass}">`;
  let i = fromIndex;

  while (i < lines.length) {
    const ul = lines[i].match(/^(\s*)[-*] (.+)$/);
    const ol = lines[i].match(/^(\s*)(\d+)\. (.+)$/);
    const match = ul || ol;
    if (!match) break;

    const indent = match[1].length;
    if (indent < baseIndent) break;

    if (indent > baseIndent) {
      const sub = buildList(lines, i);
      if (html.endsWith("</li>")) {
        html = html.slice(0, -5) + sub.html + "</li>";
      } else {
        html += `<li class="ml-2">${sub.html}</li>`;
      }
      i = sub.nextIndex;
    } else {
      const content = ul ? ul[2] : ol![3];
      html += `<li class="ml-2">${content}</li>`;
      i++;
    }
  }

  html += `</${tag}>`;
  return { html, nextIndex: i };
}
