// DOM-based code panel for crisp text rendering

export class CodePanel {
  constructor(source, width, height) {
    this.source = source;
    this.width = width;
    this.height = height;
    this.currentLine = null;

    // Create DOM element
    this.element = document.createElement('div');
    this.element.id = 'code-panel';
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;

    // Create title
    const title = document.createElement('div');
    title.className = 'code-panel-title';
    title.textContent = 'demo.py';
    this.element.appendChild(title);

    // Create code container
    this.codeContainer = document.createElement('pre');
    this.codeContainer.className = 'code-container';
    this.element.appendChild(this.codeContainer);

    // Render source code
    this._renderSource();

    // Append to body
    document.body.appendChild(this.element);
  }

  _renderSource() {
    const lines = this.source.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Create line wrapper
      const lineDiv = document.createElement('div');
      lineDiv.className = 'line';
      lineDiv.dataset.line = lineNumber;

      // Line number
      const lineNumSpan = document.createElement('span');
      lineNumSpan.className = 'line-number';
      lineNumSpan.textContent = lineNumber;
      lineDiv.appendChild(lineNumSpan);

      // Source code with syntax highlighting
      const codeSpan = document.createElement('span');
      codeSpan.className = 'line-content';
      codeSpan.innerHTML = this._highlightSyntax(line);
      lineDiv.appendChild(codeSpan);

      this.codeContainer.appendChild(lineDiv);
    });
  }

  _highlightSyntax(line) {
    // Escape HTML entities first
    let highlighted = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 1. Strings (f-strings, single quotes, double quotes)
    // Must be done BEFORE keywords to avoid matching class="keyword" attributes
    highlighted = highlighted.replace(/(f?"[^"]*"|f?'[^']*')/g, '<span class="string">$1</span>');

    // 2. Comments
    highlighted = highlighted.replace(/(#.*$)/g, '<span class="comment">$1</span>');

    // 3. Keywords
    const keywords = /\b(def|if|elif|else|return|for|in|range|print|__name__|__main__)\b/g;
    highlighted = highlighted.replace(keywords, '<span class="keyword">$1</span>');

    // 4. Function names (after def keyword span)
    // Note: We match the span we just created for 'def'
    highlighted = highlighted.replace(/<span class="keyword">def<\/span>\s+(\w+)/g,
      '<span class="keyword">def</span> <span class="function">$1</span>');

    // 5. Numbers (but not inside strings - simple approach)
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');

    return highlighted;
  }

  highlightLine(lineNumber) {
    if (this.currentLine === lineNumber) return;

    // Remove previous highlight
    if (this.currentLine !== null) {
      const prevLine = this.codeContainer.querySelector(`[data-line="${this.currentLine}"]`);
      if (prevLine) {
        prevLine.classList.remove('highlighted');
      }
    }

    if (lineNumber === null || lineNumber === undefined) {
      this.currentLine = null;
      return;
    }

    this.currentLine = lineNumber;

    // Add highlight to new line
    const newLine = this.codeContainer.querySelector(`[data-line="${lineNumber}"]`);
    if (newLine) {
      newLine.classList.add('highlighted');

      // Scroll to make line visible
      this._scrollToLine(newLine);
    }
  }

  _scrollToLine(lineElement) {
    const containerRect = this.codeContainer.getBoundingClientRect();
    const lineRect = lineElement.getBoundingClientRect();

    // Check if line is outside visible area
    const isAbove = lineRect.top < containerRect.top + 50;
    const isBelow = lineRect.bottom > containerRect.bottom - 50;

    if (isAbove || isBelow) {
      // Smooth scroll to bring line into view
      lineElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  reset() {
    this.highlightLine(null);
    this.codeContainer.scrollTop = 0;
  }

  // Compatibility methods for PixiJS-style API
  set position(value) {
    // DOM version ignores position (uses CSS)
  }

  destroy() {
    this.element.remove();
  }
}
