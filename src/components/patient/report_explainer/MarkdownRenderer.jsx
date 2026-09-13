import {
  FileCheck2,
  Activity,
  Stethoscope,
  Sparkles,
  Info,
} from 'lucide-react';

/**
 * Format inline text (bold, status pills, code)
 */
function renderInline(text) {
  if (!text) return null;

  // Replace status badges first with styled pills
  const parts = [];
  // Regex to split by bold (**text**) or status tags
  const regex = /(\*\*.*?\*\*|`.*?`|✅ Normal|⚠️ High|🔻 Low|❓ Inconclusive|ELEVATED|BORDERLINE HIGH)/g;

  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldContent = token.slice(2, -2);
      // Check if inside bold is a status
      if (boldContent.includes('Normal')) {
        parts.push(<span key={match.index} className="badge-pill-status normal">{boldContent}</span>);
      } else if (boldContent.includes('High') || boldContent.includes('ELEVATED')) {
        parts.push(<span key={match.index} className="badge-pill-status high">{boldContent}</span>);
      } else if (boldContent.includes('Low')) {
        parts.push(<span key={match.index} className="badge-pill-status low">{boldContent}</span>);
      } else {
        parts.push(<strong key={match.index}>{boldContent}</strong>);
      }
    } else if (token === '✅ Normal') {
      parts.push(<span key={match.index} className="badge-pill-status normal">✅ Normal</span>);
    } else if (token === '⚠️ High' || token === 'ELEVATED' || token === 'BORDERLINE HIGH') {
      parts.push(<span key={match.index} className="badge-pill-status high">⚠️ {token.replace('⚠️ ', '')}</span>);
    } else if (token === '🔻 Low') {
      parts.push(<span key={match.index} className="badge-pill-status low">🔻 Low</span>);
    } else if (token === '❓ Inconclusive') {
      parts.push(<span key={match.index} className="badge-pill-status neutral">❓ Inconclusive</span>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="code-pill">{token.slice(1, -1)}</code>);
    }

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts;
}

export function MarkdownRenderer({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inList = false;
  let currentList = [];
  let inTable = false;
  let tableRows = [];
  let tableHeaders = [];
  let inBlockquote = false;
  let blockquoteLines = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="markdown-ul">
          {currentList.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-wrapper-${elements.length}`} className="markdown-table-wrapper">
          <table className="markdown-table">
            {tableHeaders.length > 0 && (
              <thead>
                <tr>
                  {tableHeaders.map((th, i) => (
                    <th key={i}>{renderInline(th)}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <div key={`bq-${elements.length}`} className="markdown-callout">
          <Sparkles size={18} className="callout-icon" />
          <div>{blockquoteLines.map((line, i) => <p key={i}>{renderInline(line)}</p>)}</div>
        </div>
      );
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Table divider line e.g. |---|---|
    if (/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(line)) {
      continue;
    }

    // Table line e.g. | col1 | col2 |
    if (line.startsWith('|') && line.endsWith('|')) {
      if (inList) flushList();
      if (inBlockquote) flushBlockquote();

      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Callout / Blockquote
    if (line.startsWith('>')) {
      if (inList) flushList();
      inBlockquote = true;
      blockquoteLines.push(line.replace(/^>\s*/, ''));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Headings
    if (line.startsWith('## ')) {
      if (inList) flushList();
      const text = line.replace(/^##\s*/, '');
      let icon = <FileCheck2 size={20} className="heading-icon text-primary" />;
      if (text.toLowerCase().includes('quick summary') || text.toLowerCase().includes('overview')) {
        icon = <FileCheck2 size={20} className="heading-icon text-primary" />;
      } else if (text.toLowerCase().includes('test result') || text.toLowerCase().includes('breakdown')) {
        icon = <Activity size={20} className="heading-icon text-accent" />;
      } else if (text.toLowerCase().includes('question') || text.toLowerCase().includes('doctor')) {
        icon = <Stethoscope size={20} className="heading-icon text-warning" />;
      }

      elements.push(
        <div key={`h2-${i}`} className="section-header-block">
          {icon}
          <h2 className="markdown-h2">{renderInline(text)}</h2>
        </div>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      if (inList) flushList();
      const text = line.replace(/^###\s*/, '');
      elements.push(
        <div key={`h3-${i}`} className="test-card-header">
          <h3 className="markdown-h3">{renderInline(text)}</h3>
        </div>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      if (inList) flushList();
      const text = line.replace(/^#\s*/, '');
      elements.push(
        <h1 key={`h1-${i}`} className="markdown-h1">{renderInline(text)}</h1>
      );
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***') {
      if (inList) flushList();
      elements.push(<hr key={`hr-${i}`} className="markdown-divider" />);
      continue;
    }

    // List item
    if (/^[-*•]\s+/.test(line)) {
      inList = true;
      currentList.push(line.replace(/^[-*•]\s+/, ''));
      continue;
    } else if (inList) {
      flushList();
    }

    // Italic disclaimer
    if (line.startsWith('*Disclaimer:') || (line.startsWith('*') && line.endsWith('*') && line.length > 20)) {
      elements.push(
        <div key={`disc-${i}`} className="disclaimer-note">
          <Info size={15} />
          <span>{renderInline(line.replace(/^\*|\*$/g, ''))}</span>
        </div>
      );
      continue;
    }

    // Standard paragraph
    if (line) {
      elements.push(
        <p key={`p-${i}`} className="markdown-p">
          {renderInline(line)}
        </p>
      );
    }
  }

  if (inList) flushList();
  if (inTable) flushTable();
  if (inBlockquote) flushBlockquote();

  return <div className="markdown-container">{elements}</div>;
}
