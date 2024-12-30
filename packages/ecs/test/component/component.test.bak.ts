// import { Component, component, defineComponent } from '../../src/component';

// // Test Component inheritance
// class Position extends Component {
//   x: number = 0;
//   y: number = 0;

//   move(dx: number, dy: number) {
//     this.x += dx;
//     this.y += dy;
//   }
// }

// // Test Component decorator
// @component
// class Counter extends Component {
//   count: number = 0;

//   increment() {
//     this.count++;
//   }

//   add(n: number) {
//     this.count += n;
//   }
// }

// interface Score {
//   value: number;
//   highScore: number;
// }

// const Score = defineComponent<Score>({
//   name: 'Score',
//   initialData: () => ({ value: 0, highScore: 0 }),
//   methods: {
//     add(self: Score, points: number) {
//       self.value += points;
//       if (self.value > self.highScore) {
//         self.highScore = self.value;
//       }
//     },
//     reset(self: Score) {
//       self.value = 0;
//     },
//   },
// });

// describe('Component System', () => {
//   describe('Component Inheritance', () => {
//     it('should create component with initial values', () => {
//       const pos = new Position();
//       expect(pos.x).toBe(0);
//       expect(pos.y).toBe(0);
//     });

//     it('should update component values', () => {
//       const pos = new Position();
//       pos.move(5, 10);
//       expect(pos.x).toBe(5);
//       expect(pos.y).toBe(10);
//     });

//     it('should allow direct property access', () => {
//       const pos = new Position();
//       pos.x = 15;
//       pos.y = 25;
//       expect(pos.x).toBe(15);
//       expect(pos.y).toBe(25);
//     });
//   });

//   describe('Component Decorator', () => {
//     it('should create component with initial value', () => {
//       const counter = new Counter();
//       expect(counter.count).toBe(0);
//     });

//     it('should maintain instance methods', () => {
//       const counter = new Counter();
//       counter.increment();
//       expect(counter.count).toBe(1);
//       counter.add(5);
//       expect(counter.count).toBe(6);
//     });

//     it('should allow direct property access', () => {
//       const counter = new Counter();
//       counter.count = 10;
//       expect(counter.count).toBe(10);
//     });
//   });

//   describe('defineComponent', () => {
//     it('should create component with initial values', () => {
//       const score = new Score();
//       expect(score.value).toBe(0);
//       expect(score.highScore).toBe(0);
//     });

//     it('should allow direct property access', () => {
//       const score = new Score();
//       score.value = 100;
//       score.highScore = 200;
//       expect(score.value).toBe(100);
//       expect(score.highScore).toBe(200);
//     });

//     it('should use component methods correctly', () => {
//       const score = new Score();

//       // Test add method
//       score.add(100);
//       expect(score.value).toBe(100);
//       expect(score.highScore).toBe(100);

//       // Test high score tracking
//       score.add(50);
//       expect(score.value).toBe(150);
//       expect(score.highScore).toBe(150);

//       // Test reset
//       score.reset();
//       expect(score.value).toBe(0);
//       expect(score.highScore).toBe(150); // High score should persist

//       // Test add after reset
//       score.add(50);
//       expect(score.value).toBe(50);
//       expect(score.highScore).toBe(150); // High score should not change for lower scores
//     });

//     it('should handle multiple instances independently', () => {
//       const score1 = new Score();
//       const score2 = new Score();

//       score1.add(100);
//       expect(score1.value).toBe(100);
//       expect(score2.value).toBe(0);

//       score2.add(200);
//       expect(score1.value).toBe(100);
//       expect(score2.value).toBe(200);
//     });
//   });

//   describe('Type Safety', () => {
//     it('should maintain correct types for properties', () => {
//       const score = new Score();
//       score.value = 100;
//       score.highScore = 200;
//       expect(score.value).toBe(100);
//       expect(score.highScore).toBe(200);
//     });

//     it('should maintain correct types for methods', () => {
//       const score = new Score();
//       score.add(100);
//       score.reset();
//       expect(score.value).toBe(0);
//       expect(score.highScore).toBe(100);
//     });
//   });
// });
