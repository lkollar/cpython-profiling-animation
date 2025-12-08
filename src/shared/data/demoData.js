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
  source: `def add(a, b):
    return a + b

def multiply(x, y):
    result = 0
    for i in range(y):
        result = add(result, x)
    return result

def calculate(a, b):
    sum_val = add(a, b)
    product = multiply(a, b)
    return sum_val + product

def main():
    result = calculate(3, 4)
    print(f"Result: {result}")

if __name__ == "__main__":
    main()`,

  trace: [
    // Start script
    { type: 'line', file: 'demo.py', line: 20, ts: 0 },
    { type: 'line', file: 'demo.py', line: 21, ts: 50 },

    // Call main
    { type: 'call', func: 'main', file: 'demo.py', line: 16, ts: 100 },
    { type: 'line', file: 'demo.py', line: 17, ts: 150 },

    // Call calculate(3, 4)
    { type: 'call', func: 'calculate', file: 'demo.py', line: 11, ts: 200, args: { a: 3, b: 4 } },
    { type: 'line', file: 'demo.py', line: 12, ts: 250 },

    // Call add(3, 4) from calculate
    { type: 'call', func: 'add', file: 'demo.py', line: 1, ts: 300, args: { a: 3, b: 4 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 350 },
    { type: 'return', func: 'add', ts: 400, value: 7 },

    // Back in calculate, call multiply
    { type: 'line', file: 'demo.py', line: 13, ts: 450 },
    { type: 'call', func: 'multiply', file: 'demo.py', line: 4, ts: 500, args: { x: 3, y: 4 } },
    { type: 'line', file: 'demo.py', line: 5, ts: 550 },
    { type: 'line', file: 'demo.py', line: 6, ts: 600 },

    // Loop iteration 1: add(0, 3)
    { type: 'line', file: 'demo.py', line: 7, ts: 650 },
    { type: 'call', func: 'add', file: 'demo.py', line: 1, ts: 700, args: { a: 0, b: 3 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 750 },
    { type: 'return', func: 'add', ts: 800, value: 3 },

    // Loop iteration 2: add(3, 3)
    { type: 'line', file: 'demo.py', line: 6, ts: 850 },
    { type: 'line', file: 'demo.py', line: 7, ts: 900 },
    { type: 'call', func: 'add', file: 'demo.py', line: 1, ts: 950, args: { a: 3, b: 3 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 1000 },
    { type: 'return', func: 'add', ts: 1050, value: 6 },

    // Loop iteration 3: add(6, 3)
    { type: 'line', file: 'demo.py', line: 6, ts: 1100 },
    { type: 'line', file: 'demo.py', line: 7, ts: 1150 },
    { type: 'call', func: 'add', file: 'demo.py', line: 1, ts: 1200, args: { a: 6, b: 3 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 1250 },
    { type: 'return', func: 'add', ts: 1300, value: 9 },

    // Loop iteration 4: add(9, 3)
    { type: 'line', file: 'demo.py', line: 6, ts: 1350 },
    { type: 'line', file: 'demo.py', line: 7, ts: 1400 },
    { type: 'call', func: 'add', file: 'demo.py', line: 1, ts: 1450, args: { a: 9, b: 3 } },
    { type: 'line', file: 'demo.py', line: 2, ts: 1500 },
    { type: 'return', func: 'add', ts: 1550, value: 12 },

    // End loop, return from multiply
    { type: 'line', file: 'demo.py', line: 6, ts: 1600 },
    { type: 'line', file: 'demo.py', line: 8, ts: 1650 },
    { type: 'return', func: 'multiply', ts: 1700, value: 12 },

    // Back in calculate, return
    { type: 'line', file: 'demo.py', line: 14, ts: 1750 },
    { type: 'return', func: 'calculate', ts: 1800, value: 19 },

    // Back in main
    { type: 'line', file: 'demo.py', line: 18, ts: 1850 },
    { type: 'return', func: 'main', ts: 1900, value: null },

    // Back to script
    { type: 'line', file: 'demo.py', line: 21, ts: 1950 }
  ],
  samples: []
};
