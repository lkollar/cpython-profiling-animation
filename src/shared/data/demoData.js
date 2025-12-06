// Synthetic demo data: Fibonacci execution trace

export const DEMO_FIBONACCI = {
  source: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def main():
    for i in range(1):
        result = fibonacci(3)
        print(f"fibonacci(3) = {result}")

if __name__ == "__main__":
    main()`,

  // Trace with line-level events for fibonacci(3)
  // Timestamps scaled for visualization (0-3200ms)
  trace: [
    // Start script
    { type: 'line', file: 'demo.py', line: 11, ts: 0 },
    { type: 'line', file: 'demo.py', line: 12, ts: 100 },
    
    // Call main()
    { type: 'call', func: 'main', file: 'demo.py', line: 6, ts: 200 },
    { type: 'line', file: 'demo.py', line: 7, ts: 300 },
    { type: 'line', file: 'demo.py', line: 8, ts: 400 },

    // Call fibonacci(3)
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 500, args: { n: 3 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 600 },
    { type: 'line', file: 'demo.py', line: 4, ts: 700 },

    // Call fibonacci(2) (left branch of n=3)
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 800, args: { n: 2 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 900 },
    { type: 'line', file: 'demo.py', line: 4, ts: 1000 },

    // Call fibonacci(1) (left branch of n=2)
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 1100, args: { n: 1 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 1200 },
    { type: 'line', file: 'demo.py', line: 3, ts: 1300 },
    { type: 'return', func: 'fibonacci', ts: 1400, value: 1 },

    // Back in fibonacci(2), call fibonacci(0) (right branch of n=2)
    { type: 'line', file: 'demo.py', line: 4, ts: 1500 }, 
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 1600, args: { n: 0 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 1700 },
    { type: 'line', file: 'demo.py', line: 3, ts: 1800 },
    { type: 'return', func: 'fibonacci', ts: 1900, value: 0 },

    // Back in fibonacci(2), return result
    { type: 'line', file: 'demo.py', line: 4, ts: 2000 },
    { type: 'return', func: 'fibonacci', ts: 2100, value: 1 },

    // Back in fibonacci(3), call fibonacci(1) (right branch of n=3)
    { type: 'line', file: 'demo.py', line: 4, ts: 2200 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 2300, args: { n: 1 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 2400 },
    { type: 'line', file: 'demo.py', line: 3, ts: 2500 },
    { type: 'return', func: 'fibonacci', ts: 2600, value: 1 },

    // Back in fibonacci(3), return result
    { type: 'line', file: 'demo.py', line: 4, ts: 2700 },
    { type: 'return', func: 'fibonacci', ts: 2800, value: 2 },

    // Back in main
    { type: 'line', file: 'demo.py', line: 8, ts: 2900 },
    { type: 'line', file: 'demo.py', line: 9, ts: 3000 },
    { type: 'return', func: 'main', ts: 3100, value: null },
    
    // Back to script level
    { type: 'line', file: 'demo.py', line: 12, ts: 3200 }
  ],

  // Pre-recorded samples at 100ms intervals (10x original 10ms)
  // Sampling catches the program at different points
  samples: [
    { ts: 0, stack: [{ func: 'main', file: 'demo.py', line: 6 }] },
    { ts: 100, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
    ]},
    { ts: 200, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
    ]},
    { ts: 300, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 2 },
    ]},
    { ts: 400, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
    ]},
    { ts: 500, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
    ]},
    { ts: 600, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
    ]},
    { ts: 700, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
    ]},
    { ts: 800, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
    ]},
    { ts: 900, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
    ]},
    { ts: 1000, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
    ]},
    { ts: 1100, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
      { func: 'fibonacci', file: 'demo.py', line: 2 },
    ]},
    { ts: 1200, stack: [
      { func: 'main', file: 'demo.py', line: 8 },
      { func: 'fibonacci', file: 'demo.py', line: 4 },
    ]},
  ],
};

export const DEMO_SIMPLE = {
  source: `def calculate_sum(a, b):
    result = a + b
    return result

def main():
    x = 10
    y = 20
    total = calculate_sum(x, y)
    print(f"Total is {total}")

if __name__ == "__main__":
    main()`,

  trace: [
    // Start script
    { type: 'line', file: 'demo.py', line: 11, ts: 0 },
    { type: 'line', file: 'demo.py', line: 12, ts: 100 },

    // Call main
    { type: 'call', func: 'main', file: 'demo.py', line: 5, ts: 200 },
    { type: 'line', file: 'demo.py', line: 6, ts: 300 },
    { type: 'line', file: 'demo.py', line: 7, ts: 400 },
    { type: 'line', file: 'demo.py', line: 8, ts: 500 },

    // Call calculate_sum
    { type: 'call', func: 'calculate_sum', file: 'demo.py', line: 1, ts: 600, args: { a: 10, b: 20 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 700 },
    { type: 'line', file: 'demo.py', line: 3, ts: 800 },
    { type: 'return', func: 'calculate_sum', ts: 900, value: 30 },

    // Back in main
    { type: 'line', file: 'demo.py', line: 8, ts: 1000 },
    { type: 'line', file: 'demo.py', line: 9, ts: 1100 },
    { type: 'return', func: 'main', ts: 1200, value: null },

    // Back to script
    { type: 'line', file: 'demo.py', line: 12, ts: 1300 }
  ],
  samples: []
};
