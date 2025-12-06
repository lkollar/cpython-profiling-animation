// Execution trace model

export class ExecutionEvent {
  constructor(type, functionName, filename, lineno, timestamp, args = null, value = null) {
    this.type = type;              // 'call' | 'return'
    this.functionName = functionName;
    this.filename = filename;
    this.lineno = lineno;
    this.timestamp = timestamp;    // ms from start
    this.args = args;              // function arguments (for calls)
    this.value = value;            // return value (for returns)
  }
}

export class ExecutionTrace {
  constructor(source, events) {
    this.source = source;          // source code string
    this.events = events.map(e => new ExecutionEvent(
      e.type,
      e.func,
      e.file,
      e.line,
      e.ts,
      e.args,
      e.value
    ));
    this.duration = events.length > 0 ? events[events.length - 1].ts : 0;
  }

  // Get all events up to a specific timestamp
  getEventsUntil(timestamp) {
    return this.events.filter(e => e.timestamp <= timestamp);
  }

  // Get the current stack state at a specific timestamp
  getStackAt(timestamp) {
    const stack = [];
    const events = this.getEventsUntil(timestamp);

    for (const event of events) {
      if (event.type === 'call') {
        stack.push({
          func: event.functionName,
          file: event.filename,
          line: event.lineno,
          args: event.args,
        });
      } else if (event.type === 'return') {
        stack.pop();
      } else if (event.type === 'line') {
        // Update current line of top stack frame
        if (stack.length > 0) {
          stack[stack.length - 1].line = event.lineno;
        }
      }
    }

    return stack;
  }

  // Get the next event after a timestamp
  getNextEvent(timestamp) {
    return this.events.find(e => e.timestamp > timestamp);
  }

  // Get source code lines
  getSourceLines() {
    return this.source.split('\n');
  }
}
