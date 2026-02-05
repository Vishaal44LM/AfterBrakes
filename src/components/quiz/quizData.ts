 import { QuizQuestion } from './types';
 
 export const quizQuestions: QuizQuestion[] = [
   // EASY - General
   {
     id: 'e1',
     question: 'What does the "R" in RPM stand for?',
     answers: ['Revolutions', 'Rotations', 'Radial', 'Rapid'],
     correctIndex: 0,
     category: 'general',
     difficulty: 'easy'
   },
   {
     id: 'e2',
     question: 'Which pedal is typically on the far left in a manual car?',
     answers: ['Brake', 'Accelerator', 'Clutch', 'Parking brake'],
     correctIndex: 2,
     category: 'general',
     difficulty: 'easy'
   },
   {
     id: 'e3',
     question: 'What fluid is used in a car\'s windshield washer system?',
     answers: ['Engine oil', 'Washer fluid', 'Brake fluid', 'Coolant'],
     correctIndex: 1,
     category: 'general',
     difficulty: 'easy'
   },
   {
     id: 'e4',
     question: 'What does ABS stand for in cars?',
     answers: ['Auto Brake System', 'Anti-lock Braking System', 'Advanced Brake Safety', 'Automatic Balance System'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'easy'
   },
   {
     id: 'e5',
     question: 'Which color typically indicates the low fuel warning light?',
     answers: ['Green', 'Blue', 'Orange/Yellow', 'White'],
     correctIndex: 2,
     category: 'general',
     difficulty: 'easy'
   },
   {
     id: 'e6',
     question: 'What is the purpose of a car\'s alternator?',
     answers: ['Cool the engine', 'Charge the battery', 'Filter air', 'Control speed'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'easy'
   },
   {
     id: 'e7',
     question: 'Which company makes the Mustang?',
     answers: ['Chevrolet', 'Ford', 'Dodge', 'Toyota'],
     correctIndex: 1,
     category: 'brand-history',
     difficulty: 'easy'
   },
   {
     id: 'e8',
     question: 'What should you check before a long road trip?',
     answers: ['Tyre pressure', 'Paint color', 'Seat fabric', 'Radio volume'],
     correctIndex: 0,
     category: 'general',
     difficulty: 'easy'
   },
   {
     id: 'e9',
     question: 'What does the handbrake primarily secure?',
     answers: ['Front wheels', 'Rear wheels', 'Steering', 'Engine'],
     correctIndex: 1,
     category: 'general',
     difficulty: 'easy'
   },
   {
     id: 'e10',
     question: 'Which mirror eliminates blind spots?',
     answers: ['Rearview', 'Side mirror', 'Convex/blind spot mirror', 'Sun visor'],
     correctIndex: 2,
     category: 'road-rules',
     difficulty: 'easy'
   },
 
   // MEDIUM - Tech & General
   {
     id: 'm1',
     question: 'What does a catalytic converter do?',
     answers: ['Increases horsepower', 'Reduces harmful emissions', 'Improves fuel economy', 'Cools the engine'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'medium'
   },
   {
     id: 'm2',
     question: 'What is the typical lifespan of brake pads?',
     answers: ['10,000 km', '25,000-70,000 km', '100,000+ km', '5,000 km'],
     correctIndex: 1,
     category: 'general',
     difficulty: 'medium'
   },
   {
     id: 'm3',
     question: 'Which type of engine uses spark plugs?',
     answers: ['Diesel', 'Petrol/Gasoline', 'Electric', 'Hydrogen'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'medium'
   },
   {
     id: 'm4',
     question: 'What does ESP stand for in vehicles?',
     answers: ['Electric Speed Programming', 'Electronic Stability Program', 'Engine Safety Protocol', 'Extended Service Plan'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'medium'
   },
   {
     id: 'm5',
     question: 'Which car brand uses a prancing horse logo?',
     answers: ['Lamborghini', 'Porsche', 'Ferrari', 'Maserati'],
     correctIndex: 2,
     category: 'brand-history',
     difficulty: 'medium'
   },
   {
     id: 'm6',
     question: 'What is "turbo lag"?',
     answers: ['Slow acceleration at low RPM', 'Delay in turbo boost delivery', 'Overheating turbocharger', 'Fuel inefficiency'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'medium'
   },
   {
     id: 'm7',
     question: 'What is the purpose of a timing belt?',
     answers: ['Connect wheels to axle', 'Synchronize engine components', 'Control air conditioning', 'Adjust seat position'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'medium'
   },
   {
     id: 'm8',
     question: 'In F1, what is DRS?',
     answers: ['Drag Reduction System', 'Driver Response System', 'Dynamic Racing Setup', 'Direct Route Strategy'],
     correctIndex: 0,
     category: 'motorsport',
     difficulty: 'medium'
   },
   {
     id: 'm9',
     question: 'What does a car\'s differential do?',
     answers: ['Filter exhaust', 'Allow wheels to spin at different speeds', 'Cool the transmission', 'Measure speed'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'medium'
   },
   {
     id: 'm10',
     question: 'What is the safe following distance rule called?',
     answers: ['One car length', 'Two-second rule', 'Half speed rule', 'Mirror check rule'],
     correctIndex: 1,
     category: 'road-rules',
     difficulty: 'medium'
   },
 
   // HARD - Motorsport & Advanced
   {
     id: 'h1',
     question: 'What year was the first Formula 1 World Championship held?',
     answers: ['1946', '1950', '1955', '1960'],
     correctIndex: 1,
     category: 'motorsport',
     difficulty: 'hard'
   },
   {
     id: 'h2',
     question: 'What is the compression ratio of most modern diesel engines?',
     answers: ['8:1 to 10:1', '14:1 to 25:1', '5:1 to 7:1', '30:1 to 40:1'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'hard'
   },
   {
     id: 'h3',
     question: 'Which driver holds the most F1 World Championships?',
     answers: ['Ayrton Senna', 'Sebastian Vettel', 'Michael Schumacher', 'Lewis Hamilton'],
     correctIndex: 3,
     category: 'motorsport',
     difficulty: 'hard'
   },
   {
     id: 'h4',
     question: 'What is VTEC technology associated with?',
     answers: ['Toyota', 'Honda', 'BMW', 'Mercedes'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'hard'
   },
   {
     id: 'h5',
     question: 'What does the Nürburgring Nordschleife lap time indicate?',
     answers: ['Fuel efficiency', 'Performance benchmark', 'Safety rating', 'Emissions level'],
     correctIndex: 1,
     category: 'motorsport',
     difficulty: 'hard'
   },
   {
     id: 'h6',
     question: 'What is "lift-off oversteer"?',
     answers: ['Front wheels losing grip on acceleration', 'Rear losing grip when throttle is released', 'Braking too hard', 'Steering input delay'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'hard'
   },
   {
     id: 'h7',
     question: 'Which Le Mans race distance record is legendary?',
     answers: ['12 hours', '24 hours', '48 hours', '6 hours'],
     correctIndex: 1,
     category: 'motorsport',
     difficulty: 'hard'
   },
   {
     id: 'h8',
     question: 'What is a double-wishbone suspension known for?',
     answers: ['Simplicity and cost', 'Superior handling and camber control', 'Reducing weight', 'Noise reduction'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'hard'
   },
   {
     id: 'h9',
     question: 'What does homologation mean in motorsport?',
     answers: ['Engine upgrade', 'Approval for racing compliance', 'Team registration', 'Driver training'],
     correctIndex: 1,
     category: 'motorsport',
     difficulty: 'hard'
   },
   {
     id: 'h10',
     question: 'Which car first featured regenerative braking for road use?',
     answers: ['Tesla Model S', 'Toyota Prius', 'Honda Insight', 'BMW i3'],
     correctIndex: 1,
     category: 'tech',
     difficulty: 'hard'
   }
 ];
 
 export const getQuestionsByDifficulty = (difficulty: string): QuizQuestion[] => {
   return quizQuestions.filter(q => q.difficulty === difficulty);
 };
 
 export const getRandomQuestions = (
   count: number, 
   difficulties: string[], 
   excludeIds: string[] = []
 ): QuizQuestion[] => {
   const available = quizQuestions.filter(
     q => difficulties.includes(q.difficulty) && !excludeIds.includes(q.id)
   );
   
   // Shuffle and pick
   const shuffled = [...available].sort(() => Math.random() - 0.5);
   return shuffled.slice(0, Math.min(count, shuffled.length));
 };