// Synthetic demo data: Fibonacci execution trace

export const DEMO_FIBONACCI = {
  source: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def main():
    for i in range(3):
        result = fibonacci(5)
        print(f"fibonacci(5) = {result}")

if __name__ == "__main__":
    main()`,

  // Pre-recorded execution trace for fibonacci(5) called 3 times
  // fibonacci(5) makes 15 calls total (tree structure)
  // Timestamps multiplied by 10 for better visualization (0-1250ms instead of 0-125ms)
  trace: [
    // Start main
    { type: 'call', func: 'main', file: 'demo.py', line: 6, ts: 0 },

    // First fibonacci(5) call - iteration 0
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 50, args: { n: 5 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 70, args: { n: 4 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 90, args: { n: 3 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 110, args: { n: 2 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 130, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 140, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 150, args: { n: 0 } },
    { type: 'return', func: 'fibonacci', ts: 160, value: 0 },
    { type: 'return', func: 'fibonacci', ts: 170, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 180, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 190, value: 1 },
    { type: 'return', func: 'fibonacci', ts: 200, value: 2 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 210, args: { n: 2 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 230, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 240, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 250, args: { n: 0 } },
    { type: 'return', func: 'fibonacci', ts: 260, value: 0 },
    { type: 'return', func: 'fibonacci', ts: 270, value: 1 },
    { type: 'return', func: 'fibonacci', ts: 280, value: 3 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 290, args: { n: 3 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 310, args: { n: 2 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 330, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 340, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 350, args: { n: 0 } },
    { type: 'return', func: 'fibonacci', ts: 360, value: 0 },
    { type: 'return', func: 'fibonacci', ts: 370, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 380, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 390, value: 1 },
    { type: 'return', func: 'fibonacci', ts: 400, value: 2 },
    { type: 'return', func: 'fibonacci', ts: 410, value: 5 },

    // Second fibonacci(5) call - iteration 1 (abbreviated for brevity)
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 450, args: { n: 5 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 470, args: { n: 4 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 490, args: { n: 3 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 510, args: { n: 2 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 530, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 540, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 550, args: { n: 0 } },
    { type: 'return', func: 'fibonacci', ts: 560, value: 0 },
    { type: 'return', func: 'fibonacci', ts: 570, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 580, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 590, value: 1 },
    { type: 'return', func: 'fibonacci', ts: 600, value: 2 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 610, args: { n: 2 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 630, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 640, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 650, args: { n: 0 } },
    { type: 'return', func: 'fibonacci', ts: 660, value: 0 },
    { type: 'return', func: 'fibonacci', ts: 670, value: 1 },
    { type: 'return', func: 'fibonacci', ts: 680, value: 3 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 690, args: { n: 3 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 710, args: { n: 2 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 730, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 740, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 750, args: { n: 0 } },
    { type: 'return', func: 'fibonacci', ts: 760, value: 0 },
    { type: 'return', func: 'fibonacci', ts: 770, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 780, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 790, value: 1 },
    { type: 'return', func: 'fibonacci', ts: 800, value: 2 },
    { type: 'return', func: 'fibonacci', ts: 810, value: 5 },

    // Third fibonacci(5) call - iteration 2
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 850, args: { n: 5 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 870, args: { n: 4 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 890, args: { n: 3 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 910, args: { n: 2 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 930, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 940, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 950, args: { n: 0 } },
    { type: 'return', func: 'fibonacci', ts: 960, value: 0 },
    { type: 'return', func: 'fibonacci', ts: 970, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 980, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 990, value: 1 },
    { type: 'return', func: 'fibonacci', ts: 1000, value: 2 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 1010, args: { n: 2 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 1030, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 1040, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 1050, args: { n: 0 } },
    { type: 'return', func: 'fibonacci', ts: 1060, value: 0 },
    { type: 'return', func: 'fibonacci', ts: 1070, value: 1 },
    { type: 'return', func: 'fibonacci', ts: 1080, value: 3 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 1090, args: { n: 3 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 1110, args: { n: 2 } },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 1130, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 1140, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 1150, args: { n: 0 } },
    { type: 'return', func: 'fibonacci', ts: 1160, value: 0 },
    { type: 'return', func: 'fibonacci', ts: 1170, value: 1 },
    { type: 'call', func: 'fibonacci', file: 'demo.py', line: 1, ts: 1180, args: { n: 1 } },
    { type: 'return', func: 'fibonacci', ts: 1190, value: 1 },
    { type: 'return', func: 'fibonacci', ts: 1200, value: 2 },
    { type: 'return', func: 'fibonacci', ts: 1210, value: 5 },

    // End main
    { type: 'return', func: 'main', ts: 1250 },
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
