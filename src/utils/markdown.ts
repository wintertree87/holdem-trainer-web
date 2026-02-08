export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip blank lines
    if (!trimmed) { i++; continue; }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++; // skip opening fence
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      out.push('<hr>');
      i++;
      continue;
    }

    // Heading
    const headMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headMatch) {
      const lvl = headMatch[1].length;
      out.push(`<h${lvl}>${inline(headMatch[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // Blockquote (collect consecutive > lines)
    if (trimmed.startsWith('>')) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        bqLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${bqLines.map(l => `<p>${inline(l)}</p>`).join('')}</blockquote>`);
      continue;
    }

    // Table (collect consecutive | lines)
    if (trimmed.startsWith('|')) {
      const tblRows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tblRows.push(lines[i].trim());
        i++;
      }
      const dataRows = tblRows.filter(r => !r.match(/^[|\s:-]+$/));
      if (dataRows.length > 0) {
        const parseRow = (row: string) =>
          row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
        const hCells = parseRow(dataRows[0]);
        const thead = '<thead><tr>' + hCells.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead>';
        const tbody = '<tbody>' + dataRows.slice(1).map(row => {
          const cells = parseRow(row);
          return '<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
        }).join('') + '</tbody>';
        out.push(`<table>${thead}${tbody}</table>`);
      }
      continue;
    }

    // Checkbox list (- [ ] or - [x]) — must check before unordered list
    if (/^-\s\[[ x]\]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s\[[ x]\]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^-\s\[[ x]\]\s+/, ''));
        i++;
      }
      out.push(`<ul>${items.map(it => `<li>${inline(it)}</li>`).join('')}</ul>`);
      continue;
    }

    // Unordered list (collect consecutive - or * lines)
    if (/^[-*]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
        // Skip blank lines between list items but continue if next is also a list item
        while (i < lines.length && lines[i].trim() === '') {
          if (i + 1 < lines.length && /^[-*]\s/.test(lines[i + 1].trim())) {
            i++; // skip blank line
          } else {
            break;
          }
        }
      }
      out.push(`<ul>${items.map(it => `<li>${inline(it)}</li>`).join('')}</ul>`);
      continue;
    }

    // Ordered list (collect consecutive numbered lines)
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
        // Skip blank lines between list items but continue if next is also a numbered item
        while (i < lines.length && lines[i].trim() === '') {
          if (i + 1 < lines.length && /^\d+\.\s/.test(lines[i + 1].trim())) {
            i++; // skip blank line
          } else {
            break;
          }
        }
      }
      out.push(`<ol>${items.map(it => `<li>${inline(it)}</li>`).join('')}</ol>`);
      continue;
    }

    // Paragraph: collect lines until we hit a block element or blank line
    const pLines: string[] = [];
    while (i < lines.length) {
      const cur = lines[i].trim();
      if (!cur) break; // blank line ends paragraph
      // Check if this line starts a block element
      if (cur.startsWith('```')) break;
      if (/^#{1,4}\s/.test(cur)) break;
      if (/^---+$/.test(cur)) break;
      if (cur.startsWith('>')) break;
      if (cur.startsWith('|')) break;
      if (/^-\s\[[ x]\]\s/.test(cur)) break;
      if (/^[-*]\s/.test(cur)) break;
      if (/^\d+\.\s/.test(cur)) break;
      pLines.push(cur);
      i++;
    }
    if (pLines.length > 0) {
      out.push(`<p>${pLines.map(l => inline(l)).join('<br>')}</p>`);
    }
  }

  return out.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(text: string): string {
  let r = text;
  // Links: [text](url)
  r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Bold
  r = r.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  r = r.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  r = r.replace(/`([^`]+)`/g, '<code>$1</code>');
  return r;
}
