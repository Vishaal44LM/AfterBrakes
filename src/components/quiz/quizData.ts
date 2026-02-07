import { QuizQuestion, QuizCategory, TopicAccuracy } from './types';

export const quizQuestions: QuizQuestion[] = [
  // ═══════════════════════════════════════
  // EASY — General, Tech, Brand, Road Rules
  // ═══════════════════════════════════════
  { id: 'e1', question: 'What does the "R" in RPM stand for?', answers: ['Revolutions', 'Rotations', 'Radial', 'Rapid'], correctIndex: 0, category: 'general', difficulty: 'easy', complexity: 1 },
  { id: 'e2', question: 'Which pedal is typically on the far left in a manual car?', answers: ['Brake', 'Accelerator', 'Clutch', 'Parking brake'], correctIndex: 2, category: 'general', difficulty: 'easy', complexity: 1 },
  { id: 'e3', question: 'What fluid is used in a car\'s windshield washer system?', answers: ['Engine oil', 'Washer fluid', 'Brake fluid', 'Coolant'], correctIndex: 1, category: 'general', difficulty: 'easy', complexity: 1 },
  { id: 'e4', question: 'What does ABS stand for in cars?', answers: ['Auto Brake System', 'Anti-lock Braking System', 'Advanced Brake Safety', 'Automatic Balance System'], correctIndex: 1, category: 'tech', difficulty: 'easy', complexity: 1 },
  { id: 'e5', question: 'Which color typically indicates the low fuel warning light?', answers: ['Green', 'Blue', 'Orange/Yellow', 'White'], correctIndex: 2, category: 'general', difficulty: 'easy', complexity: 1 },
  { id: 'e6', question: 'What is the purpose of a car\'s alternator?', answers: ['Cool the engine', 'Charge the battery', 'Filter air', 'Control speed'], correctIndex: 1, category: 'tech', difficulty: 'easy', complexity: 2 },
  { id: 'e7', question: 'Which company makes the Mustang?', answers: ['Chevrolet', 'Ford', 'Dodge', 'Toyota'], correctIndex: 1, category: 'brand-history', difficulty: 'easy', complexity: 1 },
  { id: 'e8', question: 'What should you check before a long road trip?', answers: ['Tyre pressure', 'Paint color', 'Seat fabric', 'Radio volume'], correctIndex: 0, category: 'safety', difficulty: 'easy', complexity: 1 },
  { id: 'e9', question: 'What does the handbrake primarily secure?', answers: ['Front wheels', 'Rear wheels', 'Steering', 'Engine'], correctIndex: 1, category: 'general', difficulty: 'easy', complexity: 2 },
  { id: 'e10', question: 'Which mirror eliminates blind spots?', answers: ['Rearview', 'Side mirror', 'Convex/blind spot mirror', 'Sun visor'], correctIndex: 2, category: 'road-rules', difficulty: 'easy', complexity: 2 },
  { id: 'e11', question: 'What does SUV stand for?', answers: ['Sport Utility Vehicle', 'Super Urban Van', 'Standard Utility Vehicle', 'Sport Urban Van'], correctIndex: 0, category: 'general', difficulty: 'easy', complexity: 1 },
  { id: 'e12', question: 'Which gas makes up most of car exhaust?', answers: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], correctIndex: 2, category: 'tech', difficulty: 'easy', complexity: 3 },
  { id: 'e13', question: 'What is the standard tire pressure unit?', answers: ['PSI', 'RPM', 'MPH', 'BHP'], correctIndex: 0, category: 'general', difficulty: 'easy', complexity: 1 },
  { id: 'e14', question: 'Which brand uses the slogan "The Ultimate Driving Machine"?', answers: ['Mercedes-Benz', 'BMW', 'Audi', 'Lexus'], correctIndex: 1, category: 'brand-history', difficulty: 'easy', complexity: 2 },
  { id: 'e15', question: 'What does the oil warning light look like?', answers: ['A wrench', 'An oil can', 'A thermometer', 'A battery'], correctIndex: 1, category: 'safety', difficulty: 'easy', complexity: 1 },

  // ═══════════════════════════════════════
  // MEDIUM — Tech, Motorsport, Road Rules
  // ═══════════════════════════════════════
  { id: 'm1', question: 'What does a catalytic converter do?', answers: ['Increases horsepower', 'Reduces harmful emissions', 'Improves fuel economy', 'Cools the engine'], correctIndex: 1, category: 'tech', difficulty: 'medium', complexity: 1 },
  { id: 'm2', question: 'What is the typical lifespan of brake pads?', answers: ['10,000 km', '25,000-70,000 km', '100,000+ km', '5,000 km'], correctIndex: 1, category: 'general', difficulty: 'medium', complexity: 1 },
  { id: 'm3', question: 'Which type of engine uses spark plugs?', answers: ['Diesel', 'Petrol/Gasoline', 'Electric', 'Hydrogen'], correctIndex: 1, category: 'tech', difficulty: 'medium', complexity: 1 },
  { id: 'm4', question: 'What does ESP stand for in vehicles?', answers: ['Electric Speed Programming', 'Electronic Stability Program', 'Engine Safety Protocol', 'Extended Service Plan'], correctIndex: 1, category: 'tech', difficulty: 'medium', complexity: 2 },
  { id: 'm5', question: 'Which car brand uses a prancing horse logo?', answers: ['Lamborghini', 'Porsche', 'Ferrari', 'Maserati'], correctIndex: 2, category: 'brand-history', difficulty: 'medium', complexity: 1 },
  { id: 'm6', question: 'What is "turbo lag"?', answers: ['Slow acceleration at low RPM', 'Delay in turbo boost delivery', 'Overheating turbocharger', 'Fuel inefficiency'], correctIndex: 1, category: 'tech', difficulty: 'medium', complexity: 2 },
  { id: 'm7', question: 'What is the purpose of a timing belt?', answers: ['Connect wheels to axle', 'Synchronize engine components', 'Control air conditioning', 'Adjust seat position'], correctIndex: 1, category: 'tech', difficulty: 'medium', complexity: 2 },
  { id: 'm8', question: 'In F1, what is DRS?', answers: ['Drag Reduction System', 'Driver Response System', 'Dynamic Racing Setup', 'Direct Route Strategy'], correctIndex: 0, category: 'motorsport', difficulty: 'medium', complexity: 1 },
  { id: 'm9', question: 'What does a car\'s differential do?', answers: ['Filter exhaust', 'Allow wheels to spin at different speeds', 'Cool the transmission', 'Measure speed'], correctIndex: 1, category: 'tech', difficulty: 'medium', complexity: 2 },
  { id: 'm10', question: 'What is the safe following distance rule called?', answers: ['One car length', 'Two-second rule', 'Half speed rule', 'Mirror check rule'], correctIndex: 1, category: 'road-rules', difficulty: 'medium', complexity: 1 },
  { id: 'm11', question: 'What does OBD stand for?', answers: ['On-Board Diagnostics', 'Optimal Brake Distribution', 'Open Battery Display', 'Output Balance Data'], correctIndex: 0, category: 'tech', difficulty: 'medium', complexity: 1 },
  { id: 'm12', question: 'Which company invented the three-point seatbelt?', answers: ['Ford', 'Toyota', 'Volvo', 'Mercedes-Benz'], correctIndex: 2, category: 'safety', difficulty: 'medium', complexity: 2 },
  { id: 'm13', question: 'What is understeer?', answers: ['Car turns more than expected', 'Car turns less than expected', 'Rear slides out', 'Tires lock up'], correctIndex: 1, category: 'tech', difficulty: 'medium', complexity: 3 },
  { id: 'm14', question: 'What does a tachometer measure?', answers: ['Speed', 'Engine RPM', 'Fuel level', 'Temperature'], correctIndex: 1, category: 'general', difficulty: 'medium', complexity: 1 },
  { id: 'm15', question: 'Which racing series is known for identical cars?', answers: ['Formula 1', 'NASCAR', 'Rally', 'MotoGP'], correctIndex: 1, category: 'motorsport', difficulty: 'medium', complexity: 3 },

  // ═══════════════════════════════════════
  // HARD — Advanced Tech, Motorsport, History
  // ═══════════════════════════════════════
  { id: 'h1', question: 'What year was the first Formula 1 World Championship held?', answers: ['1946', '1950', '1955', '1960'], correctIndex: 1, category: 'motorsport', difficulty: 'hard', complexity: 1 },
  { id: 'h2', question: 'What is the compression ratio of most modern diesel engines?', answers: ['8:1 to 10:1', '14:1 to 25:1', '5:1 to 7:1', '30:1 to 40:1'], correctIndex: 1, category: 'tech', difficulty: 'hard', complexity: 2 },
  { id: 'h3', question: 'Which driver holds the most F1 World Championships?', answers: ['Ayrton Senna', 'Sebastian Vettel', 'Michael Schumacher', 'Lewis Hamilton'], correctIndex: 3, category: 'motorsport', difficulty: 'hard', complexity: 1 },
  { id: 'h4', question: 'What is VTEC technology associated with?', answers: ['Toyota', 'Honda', 'BMW', 'Mercedes'], correctIndex: 1, category: 'tech', difficulty: 'hard', complexity: 1 },
  { id: 'h5', question: 'What does the Nürburgring Nordschleife lap time indicate?', answers: ['Fuel efficiency', 'Performance benchmark', 'Safety rating', 'Emissions level'], correctIndex: 1, category: 'motorsport', difficulty: 'hard', complexity: 2 },
  { id: 'h6', question: 'What is "lift-off oversteer"?', answers: ['Front wheels losing grip on acceleration', 'Rear losing grip when throttle is released', 'Braking too hard', 'Steering input delay'], correctIndex: 1, category: 'tech', difficulty: 'hard', complexity: 3 },
  { id: 'h7', question: 'Which Le Mans race distance record is legendary?', answers: ['12 hours', '24 hours', '48 hours', '6 hours'], correctIndex: 1, category: 'motorsport', difficulty: 'hard', complexity: 1 },
  { id: 'h8', question: 'What is a double-wishbone suspension known for?', answers: ['Simplicity and cost', 'Superior handling and camber control', 'Reducing weight', 'Noise reduction'], correctIndex: 1, category: 'tech', difficulty: 'hard', complexity: 2 },
  { id: 'h9', question: 'What does homologation mean in motorsport?', answers: ['Engine upgrade', 'Approval for racing compliance', 'Team registration', 'Driver training'], correctIndex: 1, category: 'motorsport', difficulty: 'hard', complexity: 2 },
  { id: 'h10', question: 'Which car first featured regenerative braking for road use?', answers: ['Tesla Model S', 'Toyota Prius', 'Honda Insight', 'BMW i3'], correctIndex: 1, category: 'tech', difficulty: 'hard', complexity: 3 },
  { id: 'h11', question: 'What is the Coanda effect used for in F1 aerodynamics?', answers: ['Cooling brakes', 'Directing airflow along surfaces', 'Reducing tire wear', 'Increasing top speed'], correctIndex: 1, category: 'motorsport', difficulty: 'hard', complexity: 3 },
  { id: 'h12', question: 'What material are F1 brake discs typically made of?', answers: ['Steel', 'Carbon-carbon composite', 'Aluminum', 'Titanium'], correctIndex: 1, category: 'motorsport', difficulty: 'hard', complexity: 2 },
  { id: 'h13', question: 'What is the Wankel engine also known as?', answers: ['Flat engine', 'Rotary engine', 'V engine', 'Inline engine'], correctIndex: 1, category: 'tech', difficulty: 'hard', complexity: 2 },
  { id: 'h14', question: 'Which road car first had active aerodynamics?', answers: ['Porsche 959', 'Ferrari F40', 'Bugatti EB110', 'McLaren F1'], correctIndex: 0, category: 'brand-history', difficulty: 'hard', complexity: 3 },
  { id: 'h15', question: 'What is a limited-slip differential designed to prevent?', answers: ['Overheating', 'Wheel spin on one axle', 'Brake fade', 'Steering drift'], correctIndex: 1, category: 'tech', difficulty: 'hard', complexity: 2 },
];

export const getQuestionsByDifficulty = (difficulty: string): QuizQuestion[] => {
  return quizQuestions.filter(q => q.difficulty === difficulty);
};

/**
 * Smart question selection with anti-repetition and topic balancing.
 * - Excludes recently seen IDs
 * - Prefers underperforming topics
 * - Avoids same-topic back-to-back
 * - Respects complexity bias for adaptive difficulty
 */
export const getSmartQuestions = (
  count: number,
  difficulty: string,
  recentlySeenIds: string[],
  todayAnsweredIds: string[],
  topicAccuracy: TopicAccuracy,
  complexityBias: number = 0
): QuizQuestion[] => {
  // Filter available questions
  let available = quizQuestions.filter(q => 
    q.difficulty === difficulty &&
    !recentlySeenIds.includes(q.id) &&
    !todayAnsweredIds.includes(q.id)
  );

  // If too few, relax recently-seen but still exclude today's
  if (available.length < count) {
    available = quizQuestions.filter(q => 
      q.difficulty === difficulty &&
      !todayAnsweredIds.includes(q.id)
    );
  }

  // If still too few, just filter by difficulty
  if (available.length < count) {
    available = quizQuestions.filter(q => q.difficulty === difficulty);
  }

  // Score each question for selection priority
  const scored = available.map(q => {
    let score = Math.random() * 10; // Base randomness

    // Prefer underperforming topics
    const topicStats = topicAccuracy[q.category];
    if (topicStats && topicStats.answered > 0) {
      const topicAcc = topicStats.correct / topicStats.answered;
      score += (1 - topicAcc) * 15; // Lower accuracy → higher priority
    } else {
      score += 8; // Never-seen topic gets moderate boost
    }

    // Complexity bias from adaptive difficulty
    const qComplexity = q.complexity || 2;
    const targetComplexity = Math.max(1, Math.min(3, 2 + complexityBias));
    score -= Math.abs(qComplexity - targetComplexity) * 3;

    return { question: q, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Pick top candidates, ensuring no back-to-back same topic
  const selected: QuizQuestion[] = [];
  for (const item of scored) {
    if (selected.length >= count) break;
    const lastTopic = selected.length > 0 ? selected[selected.length - 1].category : null;
    if (lastTopic === item.question.category && scored.length > count) continue;
    selected.push(item.question);
  }

  // Fill remaining if topic constraint was too strict
  if (selected.length < count) {
    for (const item of scored) {
      if (selected.length >= count) break;
      if (!selected.find(s => s.id === item.question.id)) {
        selected.push(item.question);
      }
    }
  }

  return selected;
};

// Legacy export for backward compat
export const getRandomQuestions = (
  count: number,
  difficulties: string[],
  excludeIds: string[] = []
): QuizQuestion[] => {
  const available = quizQuestions.filter(
    q => difficulties.includes(q.difficulty) && !excludeIds.includes(q.id)
  );
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};
