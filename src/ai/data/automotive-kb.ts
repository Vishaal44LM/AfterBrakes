/**
 * Automotive Knowledge Base
 * 
 * Curated dataset covering:
 * - Diagnostic patterns (symptom → cause mappings)
 * - Maintenance guides (service intervals, procedures)
 * - Component explanations (what parts do, failure modes)
 * - Vehicle complaints (common reported issues)
 * - FAQs (frequently asked automotive questions)
 * 
 * Each entry is structured for TF-IDF indexing and similarity matching.
 * Keywords are manually curated for high precision.
 */

import { KnowledgeEntry } from "../types";

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ═══ DIAGNOSTIC PATTERNS ═══
  {
    id: "diag-001",
    category: "diagnostic_pattern",
    title: "Engine overheating while driving",
    content: "Engine overheating is indicated by the temperature gauge reading high or a warning light. Common causes include low coolant level due to a leak, a failed thermostat stuck in the closed position, a malfunctioning water pump, a clogged radiator, or a blown head gasket. Immediate action: pull over safely and turn off the engine. Do not open the radiator cap when hot.",
    keywords: ["overheating", "temperature", "coolant", "thermostat", "water pump", "radiator", "head gasket", "hot engine", "steam", "gauge"],
    severity: "critical",
    relatedComponents: ["radiator", "thermostat", "water pump", "coolant reservoir", "head gasket", "cooling fan"],
  },
  {
    id: "diag-002",
    category: "diagnostic_pattern",
    title: "Car won't start – no crank",
    content: "When the engine does not crank at all upon turning the key, the issue is usually electrical. Most common cause is a dead or weak battery. Other possibilities include corroded battery terminals, a faulty starter motor, a bad ignition switch, or a failed starter relay/solenoid. Check for interior lights functioning to assess battery condition.",
    keywords: ["no start", "won't start", "no crank", "dead battery", "starter", "ignition", "key", "click", "silent", "electrical"],
    severity: "high",
    relatedComponents: ["battery", "starter motor", "ignition switch", "starter relay", "alternator"],
  },
  {
    id: "diag-003",
    category: "diagnostic_pattern",
    title: "Car won't start – cranks but no fire",
    content: "When the engine cranks normally but does not start, the problem is typically fuel or ignition related. Check for: no fuel (empty tank or failed fuel pump), clogged fuel filter, faulty spark plugs or ignition coils, failed crankshaft position sensor, or immobilizer issue. Listen for the fuel pump priming sound when turning key to ON position.",
    keywords: ["cranks", "no start", "won't fire", "fuel pump", "spark plug", "ignition coil", "crank sensor", "immobilizer", "no fuel"],
    severity: "high",
    relatedComponents: ["fuel pump", "spark plugs", "ignition coils", "crankshaft position sensor", "fuel filter"],
  },
  {
    id: "diag-004",
    category: "diagnostic_pattern",
    title: "Brake pedal feels spongy or soft",
    content: "A spongy or soft brake pedal typically indicates air in the brake hydraulic system. Other causes include a brake fluid leak, worn brake pads causing excess travel, a failing brake master cylinder, or contaminated/old brake fluid that has absorbed moisture. Brake bleeding is the standard fix for air in the system.",
    keywords: ["spongy brake", "soft pedal", "brake feel", "air in brakes", "brake fluid", "master cylinder", "brake bleed", "pedal travel"],
    severity: "critical",
    relatedComponents: ["brake master cylinder", "brake lines", "brake calipers", "brake fluid", "brake pads"],
  },
  {
    id: "diag-005",
    category: "diagnostic_pattern",
    title: "Steering wheel vibration at highway speed",
    content: "Vibration in the steering wheel that appears or worsens at highway speeds (60-100 km/h) most commonly indicates unbalanced wheels. Other causes include warped brake rotors (vibration during braking), worn tie rod ends, damaged wheel bearings, or out-of-round tires. Start with a wheel balance and alignment check.",
    keywords: ["vibration", "steering wheel", "shaking", "highway", "speed", "wheel balance", "alignment", "wobble", "shimmy", "tire"],
    severity: "medium",
    relatedComponents: ["wheels", "tires", "brake rotors", "tie rod ends", "wheel bearings", "suspension"],
  },
  {
    id: "diag-006",
    category: "diagnostic_pattern",
    title: "White smoke from exhaust",
    content: "White smoke from the exhaust indicates coolant burning in the combustion chamber. This is a serious symptom pointing to a blown head gasket, cracked cylinder head, or cracked engine block. Accompanying signs include coolant loss without visible leak, milky oil on the dipstick, and overheating. Requires immediate attention to prevent engine damage.",
    keywords: ["white smoke", "exhaust", "coolant burning", "head gasket", "coolant loss", "milky oil", "steam exhaust", "sweet smell"],
    severity: "critical",
    relatedComponents: ["head gasket", "cylinder head", "engine block", "coolant system"],
  },
  {
    id: "diag-007",
    category: "diagnostic_pattern",
    title: "Blue smoke from exhaust",
    content: "Blue or blue-gray smoke from the exhaust indicates engine oil burning in the combustion chamber. Causes include worn piston rings, worn valve seals, failed PCV valve, or turbocharger seal leak (in turbocharged engines). Oil consumption will be higher than normal. More visible on startup (valve seals) or under acceleration (rings).",
    keywords: ["blue smoke", "oil burning", "exhaust smoke", "piston rings", "valve seals", "oil consumption", "turbo seal", "PCV"],
    severity: "high",
    relatedComponents: ["piston rings", "valve seals", "PCV valve", "turbocharger", "engine oil"],
  },
  {
    id: "diag-008",
    category: "diagnostic_pattern",
    title: "Check engine light on – steady",
    content: "A steady (non-flashing) check engine light indicates the ECU has detected an emission or performance issue. Could range from a loose gas cap to a sensor failure. Drive normally but get the codes read soon. Common causes: O2 sensor, catalytic converter efficiency, EVAP leak, MAF sensor, or misfire. Not an emergency but should not be ignored long-term.",
    keywords: ["check engine", "MIL", "warning light", "OBD", "diagnostic code", "sensor", "emissions", "CEL", "engine light"],
    severity: "medium",
    relatedComponents: ["O2 sensor", "catalytic converter", "MAF sensor", "EVAP system", "spark plugs"],
  },
  {
    id: "diag-009",
    category: "diagnostic_pattern",
    title: "Check engine light flashing",
    content: "A flashing check engine light indicates a severe misfire that can damage the catalytic converter. This is an emergency. Reduce speed immediately, avoid hard acceleration, and get to a mechanic as soon as possible. Continuing to drive can cause thousands of rupees in catalytic converter damage on top of the original misfire issue.",
    keywords: ["flashing", "check engine", "blinking", "misfire", "catalytic converter", "emergency", "severe", "reduce speed"],
    severity: "critical",
    relatedComponents: ["catalytic converter", "spark plugs", "ignition coils", "fuel injectors"],
  },
  {
    id: "diag-010",
    category: "diagnostic_pattern",
    title: "Unusual noise when turning steering wheel",
    content: "Noise when turning the steering wheel can indicate several issues. A whining sound suggests low power steering fluid or a failing power steering pump. Clunking or popping sounds point to worn CV joints (especially on turns), bad strut mounts, or worn ball joints. Grinding may indicate a failing wheel bearing.",
    keywords: ["steering noise", "turning noise", "whining", "clunking", "popping", "power steering", "CV joint", "ball joint", "wheel bearing"],
    severity: "medium",
    relatedComponents: ["power steering pump", "CV joints", "ball joints", "strut mounts", "wheel bearings"],
  },
  {
    id: "diag-011",
    category: "diagnostic_pattern",
    title: "Poor fuel economy suddenly",
    content: "A sudden drop in fuel economy can be caused by several factors: underinflated tires, dirty air filter, faulty O2 sensor sending incorrect mixture data, stuck thermostat keeping engine cold, dragging brakes, worn spark plugs causing incomplete combustion, or a failing fuel injector. Start by checking tire pressure and air filter.",
    keywords: ["fuel economy", "mileage", "consumption", "gas mileage", "poor mileage", "fuel efficiency", "mpg", "kmpl"],
    severity: "medium",
    relatedComponents: ["tires", "air filter", "O2 sensor", "thermostat", "spark plugs", "fuel injectors"],
  },
  {
    id: "diag-012",
    category: "diagnostic_pattern",
    title: "Car pulls to one side while driving",
    content: "A vehicle pulling to one side indicates an alignment issue, uneven tire pressure, uneven tire wear, a stuck brake caliper on one side, or worn suspension components (control arm bushings, springs). If it pulls during braking specifically, suspect a stuck caliper or uneven pad wear. Start with tire pressure check and alignment.",
    keywords: ["pulling", "drifting", "one side", "alignment", "tire pressure", "caliper", "uneven wear", "steering drift"],
    severity: "medium",
    relatedComponents: ["tires", "brake caliper", "control arms", "suspension", "alignment"],
  },

  // ═══ MAINTENANCE GUIDES ═══
  {
    id: "maint-001",
    category: "maintenance_guide",
    title: "Engine oil change intervals",
    content: "Engine oil should be changed every 5,000–10,000 km or every 6 months, whichever comes first. Use the oil grade specified in your owner's manual (e.g., 5W-30, 0W-20). Synthetic oils can extend intervals to 10,000–15,000 km. Always replace the oil filter with each oil change. Running old oil causes increased engine wear, sludge buildup, and reduced fuel efficiency.",
    keywords: ["oil change", "engine oil", "oil filter", "synthetic oil", "5W-30", "oil grade", "service interval", "lubrication"],
    severity: "medium",
    relatedComponents: ["engine oil", "oil filter", "oil pan", "drain plug"],
  },
  {
    id: "maint-002",
    category: "maintenance_guide",
    title: "Brake pad replacement timing",
    content: "Brake pads should be inspected every 20,000 km and replaced when pad thickness falls below 3mm. Average lifespan is 30,000–70,000 km depending on driving style. Warning signs include squealing noise (wear indicator), grinding (metal-on-metal, immediate replacement needed), longer stopping distances, and brake pedal vibration. Always replace pads in pairs (both front or both rear).",
    keywords: ["brake pads", "brake replacement", "squealing brakes", "grinding", "brake wear", "disc pads", "brake inspection"],
    severity: "high",
    relatedComponents: ["brake pads", "brake rotors", "brake calipers", "brake fluid"],
  },
  {
    id: "maint-003",
    category: "maintenance_guide",
    title: "Tire rotation and replacement",
    content: "Rotate tires every 8,000–10,000 km to ensure even wear. Replace tires when tread depth falls below 1.6mm (legal minimum) – use the coin test. Check tire pressure monthly and before long trips. Mismatched tires affect handling and ABS performance. Alignment should be checked annually or after hitting potholes/curbs.",
    keywords: ["tire rotation", "tire replacement", "tread depth", "tire pressure", "alignment", "tire wear", "rotation pattern"],
    severity: "medium",
    relatedComponents: ["tires", "wheels", "TPMS sensor", "alignment"],
  },
  {
    id: "maint-004",
    category: "maintenance_guide",
    title: "Coolant system maintenance",
    content: "Coolant (antifreeze) should be flushed and replaced every 40,000–60,000 km or every 2–3 years. Use the coolant type specified for your vehicle (IAT, OAT, or HOAT). Check coolant level monthly. Low coolant causes overheating and engine damage. Never mix different coolant types. Inspect hoses for cracks, bulges, and leaks during each service.",
    keywords: ["coolant", "antifreeze", "radiator fluid", "coolant flush", "cooling system", "overheating prevention"],
    severity: "medium",
    relatedComponents: ["radiator", "coolant reservoir", "thermostat", "water pump", "hoses"],
  },
  {
    id: "maint-005",
    category: "maintenance_guide",
    title: "Air filter replacement",
    content: "The engine air filter should be replaced every 15,000–30,000 km or annually. A clogged air filter reduces engine power by up to 10%, increases fuel consumption, and can cause rough idle. Visual inspection: hold up to light – if you cannot see light through it, replace it. Driving in dusty conditions requires more frequent replacement.",
    keywords: ["air filter", "engine filter", "air cleaner", "filter replacement", "dusty", "clogged filter", "airflow"],
    severity: "low",
    relatedComponents: ["air filter", "air intake", "MAF sensor", "throttle body"],
  },
  {
    id: "maint-006",
    category: "maintenance_guide",
    title: "Timing belt replacement",
    content: "Timing belts should be replaced every 60,000–100,000 km as per manufacturer schedule. Failure of a timing belt in an interference engine causes catastrophic valve damage costing ₹30,000–₹80,000+. No warning before failure. Many modern engines use timing chains instead of belts, which typically last the engine's lifetime but may stretch over time.",
    keywords: ["timing belt", "timing chain", "cam belt", "replacement interval", "interference engine", "valve damage"],
    severity: "critical",
    relatedComponents: ["timing belt", "timing chain", "tensioner", "water pump", "camshaft", "crankshaft"],
  },

  // ═══ COMPONENT EXPLANATIONS ═══
  {
    id: "comp-001",
    category: "component_info",
    title: "Catalytic converter function and failure",
    content: "The catalytic converter reduces harmful exhaust emissions (CO, NOx, hydrocarbons) by converting them into less harmful gases (CO2, N2, H2O) using platinum, palladium, and rhodium catalysts. It operates at 400–800°C. Failure causes: engine misfires (overheating the cat), oil/coolant burning, physical damage, or age. A failed cat causes increased emissions, reduced performance, and sulfur smell.",
    keywords: ["catalytic converter", "cat", "emissions", "exhaust", "catalyst", "converter failure", "emission control"],
    severity: "medium",
    relatedComponents: ["catalytic converter", "O2 sensors", "exhaust manifold", "muffler"],
  },
  {
    id: "comp-002",
    category: "component_info",
    title: "Alternator function and diagnosis",
    content: "The alternator charges the battery and powers the electrical system while the engine is running. It converts mechanical energy to electrical energy via electromagnetic induction. Output is typically 13.5–14.5V. Signs of failure: dimming lights, dead battery repeatedly, warning light on dash, whining noise, electrical components malfunctioning. Average lifespan: 100,000–150,000 km.",
    keywords: ["alternator", "charging", "battery charging", "electrical system", "voltage", "generator", "belt driven"],
    severity: "high",
    relatedComponents: ["alternator", "battery", "drive belt", "voltage regulator"],
  },
  {
    id: "comp-003",
    category: "component_info",
    title: "Suspension system components",
    content: "The suspension system includes shock absorbers (dampers), struts, springs, control arms, sway bars, and bushings. It absorbs road impacts, maintains tire contact, and provides ride comfort. Worn suspension causes: poor handling, uneven tire wear, nose diving under braking, excessive body roll, clunking noises over bumps. Inspect every 40,000 km.",
    keywords: ["suspension", "shock absorber", "strut", "spring", "control arm", "sway bar", "bushing", "ride quality", "handling"],
    severity: "medium",
    relatedComponents: ["shock absorbers", "struts", "springs", "control arms", "sway bars", "bushings"],
  },
  {
    id: "comp-004",
    category: "component_info",
    title: "Turbocharger operation and care",
    content: "A turbocharger uses exhaust gas energy to spin a turbine that compresses intake air, increasing engine power output by 30–40%. Operates at up to 150,000 RPM. Key care: always use quality oil, allow 30-second idle before shutdown (cool-down), never lug the engine, and address oil leaks promptly. Turbo failure causes: oil starvation, foreign object ingestion, excessive heat, or bearing wear.",
    keywords: ["turbo", "turbocharger", "boost", "forced induction", "turbo failure", "turbo lag", "wastegate", "intercooler"],
    severity: "high",
    relatedComponents: ["turbocharger", "intercooler", "wastegate", "boost controller", "oil feed line"],
  },

  // ═══ VEHICLE COMPLAINTS ═══
  {
    id: "comp-005",
    category: "vehicle_complaint",
    title: "AC not cooling properly",
    content: "Air conditioning not cooling can be caused by: low refrigerant (most common, usually from a leak), clogged cabin air filter, faulty compressor, damaged condenser, failed blower motor, electrical issue with the AC clutch, or expansion valve failure. First check: is the compressor clutch engaging? If not, likely low refrigerant or electrical issue.",
    keywords: ["AC", "air conditioning", "not cooling", "refrigerant", "compressor", "cabin filter", "condenser", "blower"],
    severity: "low",
    relatedComponents: ["AC compressor", "condenser", "evaporator", "cabin air filter", "refrigerant"],
  },
  {
    id: "comp-006",
    category: "vehicle_complaint",
    title: "Car battery draining overnight",
    content: "Battery draining overnight (parasitic drain) is caused by something staying powered when the car is off. Common culprits: interior light left on, faulty door switch, aftermarket accessories wired incorrectly, failing alternator diode, or a stuck relay. Normal parasitic draw is 25–50 milliamps. Anything above 75mA warrants investigation. Test with a multimeter in series.",
    keywords: ["battery drain", "parasitic drain", "dead battery morning", "overnight drain", "battery discharge", "electrical drain"],
    severity: "medium",
    relatedComponents: ["battery", "alternator", "fuses", "relays", "wiring"],
  },
  {
    id: "comp-007",
    category: "vehicle_complaint",
    title: "Clutch slipping in manual transmission",
    content: "Clutch slipping occurs when the clutch disc cannot fully grip the flywheel, causing RPM rise without corresponding speed increase. Causes: worn clutch disc (most common), oil contamination on clutch plate, weak pressure plate springs, improper adjustment, or flywheel damage. Typically occurs first in higher gears under load. Average clutch life: 60,000–100,000 km depending on driving style.",
    keywords: ["clutch slipping", "clutch worn", "RPM rise", "manual transmission", "clutch replacement", "clutch plate", "flywheel"],
    severity: "high",
    relatedComponents: ["clutch disc", "pressure plate", "flywheel", "release bearing", "clutch cable"],
  },

  // ═══ FAQs ═══
  {
    id: "faq-001",
    category: "faq",
    title: "When should I replace my car battery?",
    content: "Car batteries typically last 3–5 years. Replace when: the engine cranks slowly, headlights dim at idle, the battery is more than 4 years old, corrosion is visible on terminals, or the battery fails a load test. In hot climates, battery life may be shorter (2–3 years). Always replace with the correct size and CCA (Cold Cranking Amps) rating for your vehicle.",
    keywords: ["battery replacement", "battery life", "battery age", "CCA", "cold cranking amps", "battery test", "when replace battery"],
    severity: "low",
    relatedComponents: ["battery", "battery terminals", "alternator"],
  },
  {
    id: "faq-002",
    category: "faq",
    title: "What does the ABS warning light mean?",
    content: "The ABS (Anti-lock Braking System) warning light indicates a fault in the ABS system. Normal brakes still work, but ABS assist will not function in emergency stops. Common causes: faulty wheel speed sensor, damaged tone ring, ABS module issue, or low brake fluid. Safe to drive carefully to a mechanic but avoid hard braking situations. If both ABS and brake lights are on, stop driving.",
    keywords: ["ABS light", "ABS warning", "anti-lock braking", "wheel speed sensor", "ABS module", "brake warning"],
    severity: "medium",
    relatedComponents: ["ABS module", "wheel speed sensors", "tone rings", "brake fluid"],
  },
  {
    id: "faq-003",
    category: "faq",
    title: "Can I drive with the oil pressure warning light on?",
    content: "No. The oil pressure warning light means the engine is not getting adequate oil pressure. Driving even 30 seconds can cause severe engine damage including bearing failure, camshaft wear, and potential seizure. Pull over immediately, turn off the engine, and check oil level. If oil level is fine but light stays on, do not restart – tow to a mechanic. This light is the most serious dashboard warning.",
    keywords: ["oil pressure", "oil light", "oil warning", "engine oil pressure", "low oil", "oil gauge", "engine damage"],
    severity: "critical",
    relatedComponents: ["oil pump", "oil pressure sensor", "engine bearings", "oil filter"],
  },
  {
    id: "faq-004",
    category: "faq",
    title: "What is the difference between petrol and diesel engines?",
    content: "Petrol engines use spark ignition – a spark plug ignites the fuel-air mixture. Diesel engines use compression ignition – fuel ignites from high compression heat alone. Diesel engines are more fuel-efficient (15-30% better) and produce more torque but are heavier and noisier. Petrol engines rev higher and are smoother. Diesel requires a different fuel system with injectors operating at much higher pressures.",
    keywords: ["petrol", "diesel", "engine type", "spark ignition", "compression ignition", "fuel efficiency", "torque", "engine comparison"],
    severity: "low",
    relatedComponents: ["engine", "fuel system", "spark plugs", "fuel injectors", "turbocharger"],
  },
  {
    id: "faq-005",
    category: "faq",
    title: "How often should wheel alignment be done?",
    content: "Wheel alignment should be checked every 10,000–15,000 km or at least once a year. Additionally, get alignment checked after: hitting a large pothole or curb, replacing suspension components, new tires, or if the car pulls to one side. Signs of misalignment: uneven tire wear, vehicle pulling, steering wheel off-center. Proper alignment extends tire life and improves fuel economy.",
    keywords: ["wheel alignment", "alignment", "tire wear", "pulling", "camber", "toe", "caster", "suspension geometry"],
    severity: "low",
    relatedComponents: ["tires", "suspension", "steering", "control arms"],
  },
  {
    id: "faq-006",
    category: "faq",
    title: "Is it safe to use the phone while driving?",
    content: "Using a phone while driving is extremely dangerous and illegal in most jurisdictions. It increases accident risk by 4-6 times. Even hands-free calling reduces attention. Texting takes eyes off the road for an average of 5 seconds – at 60 km/h, that's 83 meters blind. Use phone mounts with voice commands if navigation is essential, and pull over for any interaction requiring attention.",
    keywords: ["phone driving", "distracted driving", "safety", "texting driving", "hands free", "driving laws"],
    severity: "critical",
    relatedComponents: [],
  },
];

/**
 * Get all entries for a specific category
 */
export const getEntriesByCategory = (category: string): KnowledgeEntry[] => {
  return KNOWLEDGE_BASE.filter((e) => e.category === category);
};

/**
 * Get a single entry by ID
 */
export const getEntryById = (id: string): KnowledgeEntry | undefined => {
  return KNOWLEDGE_BASE.find((e) => e.id === id);
};
