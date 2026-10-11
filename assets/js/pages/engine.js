import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/* =========================================
   3D BACKGROUND ANIMATION - 4 CYLINDER INLINE ENGINE
   ========================================= */
const canvas = document.getElementById('engine-hero-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// Wide angle view to see all 4 cylinders
camera.position.set(6, 4, 8);
camera.lookAt(0, 1, 0);

// --- Engine Parameters ---
const crankRadius = 1.0;
const rodLength = 3.5;
const pistonHeight = 0.8;
const pistonRadius = 0.8;
const cylinderSpacing = 2.0; // Distance between cylinders

// --- Materials ---
const metalMaterial = new THREE.MeshBasicMaterial({
  color: 0xaaaaaa,
  wireframe: true,
  transparent: true,
  opacity: 0.3
});

const activeMaterial = new THREE.MeshBasicMaterial({
  color: 0xe63946, // Ashwa Red
  wireframe: true,
  transparent: true,
  opacity: 0.5
});

const rodMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.2
});

// --- Reusable Geometries ---
const crankArmGeo = new THREE.BoxGeometry(0.5, crankRadius, 0.2);
const crankPinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16);
const pistonGeo = new THREE.CylinderGeometry(pistonRadius, pistonRadius, pistonHeight, 24);
const rodGeo = new THREE.BoxGeometry(0.4, rodLength, 0.3);
const cylinderGeo = new THREE.CylinderGeometry(pistonRadius + 0.1, pistonRadius + 0.1, pistonHeight * 5, 24, 2, true);
const cylinderMat = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true, opacity: 0.1, transparent: true });


// --- Cylinder Assembly Factory ---
function createCylinderAssembly(index, zOffset, crankPhase, firingOffset) {
  const assemblyGroup = new THREE.Group();
  assemblyGroup.position.z = zOffset; // Position in the bank

  // 1. Crank Group (Rotates locally around Z axis)
  // Note: In Three.js, to rotate "around Z" in world space for an inline engine along Z, 
  // the crank actually rotates around the Z-axis of the engine line. 
  const crankGroup = new THREE.Group();

  // Arm
  const arm = new THREE.Mesh(crankArmGeo, activeMaterial);
  arm.position.y = crankRadius / 2;
  crankGroup.add(arm);

  // Pin
  const pin = new THREE.Mesh(crankPinGeo, activeMaterial);
  pin.rotation.x = Math.PI / 2;
  pin.position.y = crankRadius;
  crankGroup.add(pin);

  // Add to main scene but we need to manage its rotation manually in loop
  // because it shares the main crankshaft axis.
  scene.add(crankGroup);
  crankGroup.position.z = zOffset;


  // 2. Piston (Moves Up/Down)
  const piston = new THREE.Mesh(pistonGeo, metalMaterial);
  piston.position.z = zOffset;
  scene.add(piston);

  // 3. Rod (Moves and Rotates)
  const rodGroup = new THREE.Group();
  const rod = new THREE.Mesh(rodGeo, rodMaterial);
  rod.position.y = rodLength / 2;
  rodGroup.add(rod);
  rodGroup.position.z = zOffset;
  scene.add(rodGroup);

  // 4. Cylinder Liner (Static)
  const liner = new THREE.Mesh(cylinderGeo, cylinderMat);
  liner.position.set(0, rodLength + crankRadius, zOffset);
  scene.add(liner);

  // 5. Combustion Particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 80;
  const positions = new Float32Array(particlesCount * 3);
  const originalPositions = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount; i++) {
    const r = Math.random() * 0.4;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 0.4;

    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = r * Math.sin(theta);

    originalPositions[i * 3] = positions[i * 3];
    originalPositions[i * 3 + 1] = positions[i * 3 + 1];
    originalPositions[i * 3 + 2] = positions[i * 3 + 2];
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffaa00,
    size: 0.1,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  particles.position.z = zOffset;
  scene.add(particles);

  return {
    crankGroup,
    piston,
    rodGroup,
    particles,
    particleData: { originalPositions, material: particlesMaterial },
    phase: crankPhase,
    firingOffset: firingOffset // Delay in radians logic
  };
}

// --- Create 4 Cylinders ---
// Firing Order 1-3-4-2
// Cyl 1: Phase 0. Fire 0.
// Cyl 2: Phase PI. Fire 3PI.
// Cyl 3: Phase PI. Fire PI.
// Cyl 4: Phase 0. Fire 2PI.

const cylinders = [];
// Cylinder 1
cylinders.push(createCylinderAssembly(0, -cylinderSpacing * 1.5, 0, 0));
// Cylinder 2
cylinders.push(createCylinderAssembly(1, -cylinderSpacing * 0.5, Math.PI, 3 * Math.PI));
// Cylinder 3
cylinders.push(createCylinderAssembly(2, cylinderSpacing * 0.5, Math.PI, Math.PI));
// Cylinder 4
cylinders.push(createCylinderAssembly(3, cylinderSpacing * 1.5, 0, 2 * Math.PI));


// --- Connecting Main Shaft ---
// Visual line connecting all cranks
const mainShaftGeo = new THREE.CylinderGeometry(0.1, 0.1, cylinderSpacing * 4, 8);
const mainShaft = new THREE.Mesh(mainShaftGeo, metalMaterial);
mainShaft.rotation.x = Math.PI / 2;
scene.add(mainShaft);


// --- Animation State ---
let crankAngle = 0;
const crankSpeed = 0.03;

function animate() {
  requestAnimationFrame(animate);

  crankAngle += crankSpeed;
  mainShaft.rotation.y = crankAngle; // Visual shaft spin

  // Normalized global cycle 0 - 4PI (720 deg)
  const globalExhaustCycle = crankAngle % (4 * Math.PI);

  cylinders.forEach(cyl => {
    // 1. Current Angle for this cylinder
    const currentAngle = crankAngle + cyl.phase;

    // 2. Crank Rotation
    cyl.crankGroup.rotation.z = currentAngle;

    // 3. Piston Position (Slider Crank)
    const cosA = Math.cos(currentAngle);
    const sinA = Math.sin(currentAngle);

    const crankPinX = -crankRadius * sinA;
    const crankPinY = crankRadius * cosA;

    const rodComponent = Math.sqrt(rodLength * rodLength - (crankRadius * sinA) * (crankRadius * sinA));
    const pistonY = crankPinY + rodComponent;

    cyl.piston.position.y = pistonY;

    // 4. Rod Position/Rotation
    cyl.rodGroup.position.set(crankPinX, crankPinY, cyl.rodGroup.position.z);
    const rodAngle = Math.asin((-crankPinX) / rodLength);
    cyl.rodGroup.rotation.z = -rodAngle;

    // 5. Combustion Logic
    // Check if we are near the firing point for this cylinder
    // We want to fire when global cycle is close to cyl.firingOffset

    // Calculate cycle relative to firing offset
    // Normalize difference to 0 - 4PI range
    let relativeCycle = (globalExhaustCycle - cyl.firingOffset);
    if (relativeCycle < 0) relativeCycle += (4 * Math.PI);

    // Fire window: 0 to 0.5 PI (Quarter turn after TDC)
    if (relativeCycle < 0.5 * Math.PI) {
      const combustionPhase = relativeCycle / (0.5 * Math.PI); // 0 to 1

      cyl.particleData.material.opacity = 1 - combustionPhase;
      cyl.piston.material.color.setHex(0xffaa00);

      cyl.particles.position.y = pistonY + 0.5;

      // Expand
      const positions = cyl.particles.geometry.attributes.position.array;
      const originals = cyl.particleData.originalPositions;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] = originals[i * 3] * (1 + combustionPhase * 8);
        positions[i * 3 + 1] = originals[i * 3 + 1] * (1 + combustionPhase * 8);
        positions[i * 3 + 2] = originals[i * 3 + 2] * (1 + combustionPhase * 8);
      }
      cyl.particles.geometry.attributes.position.needsUpdate = true;

    } else {
      cyl.particleData.material.opacity = 0;
      cyl.piston.material.color.setHex(0xaaaaaa);
    }
  });

  // Camera sway
  const targetX = (mouseX) * 0.5;
  const targetY = (mouseY) * 0.5;
  camera.position.x += (6 + targetX - camera.position.x) * 0.05;
  camera.position.y += (4 + targetY - camera.position.y) * 0.05;
  camera.lookAt(0, 2, 0);

  renderer.render(scene, camera);
}

// Mouse interaction
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Start
animate();

// Resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/* =========================================
   DYNAMIC CONTENT INJECTION (Unchanged)
   ========================================= */

const pageContent = {
  hero: {
    badge: "ENGINE SUBSYSTEM",
    title: "Power Unit",
    subtitle: "Precision engineering meets raw power. The heart of our vehicle, optimized for endurance, efficiency, and performance.",
    stats: [
      { number: "IC/EV", label: "Category" },
      { number: "100%", label: "Reliability" },
      { number: "FS", label: "Compliant" }
    ]
  },
  sections: [
    {
      id: "overview",
      title: "Subsystem Overview",
      content: `
                <div class="about-content">
                    <p class="lead-text">
                        The Engine subsystem is the powerhouse of the Ashwa Racing vehicle. We are responsible for not just the engine itself, but the entire ecosystem that keeps it running at peak performance. This includes the intricate design of intake and exhaust manifolds to optimize airflow, the thermal management systems to handle extreme race conditions, and the precise calibration of fuel and ignition maps.
                    </p>
                    <p>
                        Our work isn't limited to mechanical assembly. We deeply integrate with the vehicle's electronics for data acquisition, enabling us to monitor vital stats like oil pressure, coolant temperature, and air-fuel ratios in real-time. We are constantly innovating—exploring alternative fuels, hybrid regulations, and novel manufacturing techniques like 3D printing for intake components—to gain a competitive edge while strictly adhering to the rigorous constraints of Formula Student competitions.
                    </p>
                </div>
            `
    },
    {
      id: "philosophy",
      title: "Design Philosophy",
      content: `
                <div class="vision-intro">
                    <p>
                         Our design philosophy is anchored in the belief that <strong>to finish first, you must first finish</strong>. Reliability is our north star. We prioritize robust engineering solutions that can withstand the punishing vibrations and thermal loads of an endurance race over fragile, high-maintenance setups that promise marginal power gains.
                    </p>
                    <p>
                        We also emphasize <strong>serviceability and modularity</strong>. In a competition environment, every second in the pits counts. Our designs ensure that key components—like spark plugs, oil filters, and sensors—are easily accessible for rapid troubleshooting. We balance this with a commitment to efficiency, optimizing fuel consumption to reduce weight and emissions, ensuring our car is as sustainable as it is fast.
                    </p>
                </div>
            `
    },
    {
      id: "responsibilities",
      title: "Key Responsibilities",
      type: "cards",
      items: [
        {
          title: "Powertrain Integration",
          text: "We are responsible for the comprehensive packaging of the engine within the chassis. This involves designing custom mounts to dampen vibrations, aligning the output shaft with the drivetrain for maximum efficiency, and ensuring that the center of gravity remains as low as possible to enhance vehicle dynamics.",
          iconPath: "M19 5h-4V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-6 0h-2V4h2v1zm0 4h-2V8h2v1z"
        },
        {
          title: "Thermal Management",
          text: "Managing the immense heat generated by a racing engine is critical. We design and validate the entire cooling loop, including radiator sizing, fan selection, and coolant flow path optimization. We also oversee the lubrication system, employing baffles and accumulators to prevent oil starvation during high-G cornering.",
          iconPath: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
        },
        {
          title: "Advanced Calibration",
          text: "Using industry-standard ECUs, we develop complex maps for fuel injection and ignition timing. This requires extensive dyno testing to find the sweet spot between maximum power output and fuel efficiency, ensuring compliance with competition noise and emissions rules without sacrificing performance.",
          iconPath: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"
        },
        {
          title: "Validation Workflows",
          text: "We don't guess; we verify. Our team executes a rigorous testing protocol starting from component-level stress tests to full-system dyno runs. We analyze failure modes, document maintenance intervals, and create detailed run-logs to predict component lifecycles and prevent on-track failures.",
          iconPath: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-4h2v4zm0-6h-2V7h2v4z"
        }
      ]
    },
    {
      id: "specifications",
      title: "Specifications",
      content: `
                <div class="about-content">
                   <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                       <li style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                           <strong style="display: block; color: #e63946; margin-bottom: 8px; font-size: 1.1em;">Engine Platform</strong> 
                           Internal Combustion Engine (Optimized for Formula Student regulations with restrictor compliance).
                       </li>
                       <li style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                           <strong style="display: block; color: #e63946; margin-bottom: 8px; font-size: 1.1em;">Fuel Strategy</strong> 
                           High-octane Petrol / Ethanol blend capability for superior knock resistance and cooling properties.
                       </li>
                       <li style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                           <strong style="display: block; color: #e63946; margin-bottom: 8px; font-size: 1.1em;">Primary Focus</strong> 
                           <strong>Endurance & Reliability</strong>: Tuned for mid-range torque to maximize acceleration out of tight corners.
                       </li>
                        <li style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                           <strong style="display: block; color: #e63946; margin-bottom: 8px; font-size: 1.1em;">Environmental</strong> 
                           Strict adherence to noise limits (<110dB) and clean combustion standards.
                       </li>
                   </ul>
                </div>
            `
    },
    {
      id: "interfaces",
      title: "Subsystem Interfaces",
      type: "cards",
      items: [
        {
          title: "With Electronics",
          text: "We work hand-in-hand with Electronics to manage the wiring harness, integrating sensors for throttle position, manifold pressure, and temperatures. This data is fed into the ECU and our telemetry system for live pit-lane monitoring.",
          iconPath: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"
        },
        {
          title: "With Drivetrain",
          text: "The engine is only as good as the power it puts to the ground. We collaborate with Drivetrain to spec the chain drive or gear reduction ratios, ensuring the torque curve matches the gearing for optimal acceleration and top speed.",
          iconPath: "M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2H9V3H7v2H5c-1.1 0-2 .9-2 2v2H1v2h2v2H1v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z"
        },
        {
          title: "With Cooling",
          text: "Cooling is a shared responsibility. We determine the heat rejection requirements of the engine block, while the Cooling team designs the ducting and radiator placement to ensure sufficient airflow without compromising aerodynamics.",
          iconPath: "M12 2L2 22h20L12 2zm0 3.99L19.53 19H4.47L12 5.99zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z"
        },
        {
          title: "With Chassis",
          text: "The engine is a stressed member in many designs. We work with the Chassis team to ensure mounting points are reinforced, vibration isolation is sufficient, and the engine fits within the tight confines of the frame.",
          iconPath: "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"
        }
      ]
    },
    {
      id: "safety",
      title: "Safety & Reliability",
      content: `
                <div class="about-content">
                    <p>
                        Motorsport is dangerous, and safety is our absolute priority. We engineer with a <strong>fail-safe mindset</strong>, incorporating multiple kill-switches and emergency shutoff protocols. Our fuel systems are designed with burst-proof lines and secure fittings to prevent leaks.
                    </p>
                    <p>
                        Every member of the Engine team undergoes <strong>rigorous safety training</strong>, covering fire safety, chemical handling, and high-pressure system maintenance. Before any engine start, we follow a strict pre-flight checklist to inspect every bolt, hose, and wire, ensuring the safety of our driver and our team.
                    </p>
                </div>
            `
    },
    {
      id: "testing",
      title: "Testing Philosophy",
      content: `
                <div class="vision-intro">
                    <p>
                        We believe that <strong>races are won in the testing phase</strong>. Our philosophy focuses on "breaking it early" so we don't break on race day. We utilize a combination of simulated environments (using 1D engine simulation software) and track evaluation to build a comprehensive data profile.
                    </p>
                    <p>
                         A strong <strong>validation culture</strong> pervades our team. We don't just accept good numbers; we question them. We replicate failure scenarios to understand our safety margins. This rigorous process builds the deep confidence needed to push the car to its limits during endurance events.
                    </p>
                </div>
            `
    },
    {
      id: "achievements",
      title: "Achievements",
      type: "cards",
      items: [
        {
          title: "Design Excellence",
          text: "Our subsystem has been consistently recognized by judges for its cost-effective design choices and clear engineering justification, proving that smart engineering beats big budgets.",
          iconPath: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        },
        {
          title: "Endurance Reliability",
          text: "We pride ourselves on a high endurance finishing rate. Our engines have successfully powered the car through multiple 22km endurance events without thermal or mechanical failure.",
          iconPath: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
        },
        {
          title: "Skill Development",
          text: "Beyond trophies, our greatest achievement is our people. Features hundreds of hours of hands-on training, taking students from novices to industry-ready powertrain engineers.",
          iconPath: "M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 2c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 2.22 1.21 4.15 3 5.19V17c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1.81c1.79-1.04 3-2.97 3-5.19zM12 3a4 4 0 0 1 4 4h-2c0-1.1-.9-2-2-2s-2 .9-2 2H8a4 4 0 0 1 4-4z"
        }
      ]
    },
    {
      id: "culture",
      title: "Team Culture",
      content: `
                <div class="about-content">
                    <p>
                        The Engine team is built on a <strong>collaboration mindset</strong>. We operate as a tight-knit unit where every voice matters. Multidisciplinary learning is encouraged—contracting mechanics to learn basic electronics and vice versa. 
                    </p>
                    <p>
                        <strong>Mentorship</strong> is at our core. Senior members actively guide juniors, ensuring that knowledge is passed down and not lost. We celebrate small wins, learn from failures without blame, and share a collective passion for the roar of the engine.
                    </p>
                </div>
            `
    },
    {
      id: "gallery",
      title: "Gallery",
      content: `
            <div class="gallery-grid">
                 <div class="gallery-item">
                    <img src="https://assets.ashwaracing.org/images/gallery/IMG_3970_Original.webp" alt="Ashwa Racing team working in the workshop" loading="lazy">
                 </div>
                 <div class="gallery-item">
                    <img src="https://assets.ashwaracing.org/cdn-cgi/image/width=1200,format=auto/images/prototypes/RZ-X8-H/event/10.jpg" alt="Ashwa Racing Formula Student car" loading="lazy">
                 </div>
                 <div class="gallery-item">
                    <img src="https://via.placeholder.com/400x300?text=Track+Testing" alt="Car Running">
                 </div>
                 <div class="gallery-item">
                     <img src="https://via.placeholder.com/400x300?text=Dyno+Room" alt="Dyno Room">
                 </div>
            </div>
            `
    }
  ]
};

// Function to Render Content
function renderPage() {
  // Render Hero
  const heroSection = document.getElementById('hero-section');
  const h = pageContent.hero;

  // Create Grid inside Hero if not existing (it's in CSS .hero-grid but we need div)
  const heroGrid = document.createElement('div');
  heroGrid.className = 'hero-grid';
  heroSection.appendChild(heroGrid);

  const heroContent = document.createElement('div');
  heroContent.className = 'engine-hero-content';
  heroContent.innerHTML = `
        <div class="hero-badge">${h.badge}</div>
        <h1 class="glitch" data-text="${h.title}">${h.title}</h1>
        <p class="subtitle">${h.subtitle}</p>
        <div class="hero-stats">
            ${h.stats.map(s => `
                <div class="stat-item">
                    <span class="stat-number">${s.number}</span>
                    <span class="stat-label">${s.label}</span>
                </div>
            `).join('')}
        </div>
    `;
  heroSection.appendChild(heroContent);

  // Render Sections
  const mainContent = document.getElementById('main-content');

  pageContent.sections.forEach((section, index) => {
    const sectionEl = document.createElement('section');
    sectionEl.id = section.id || `section-${index}`;
    sectionEl.className = 'engine-section';

    let innerHTML = `<h2><span class="section-number">${(index + 1).toString().padStart(2, '0')}</span>${section.title}</h2>`;

    if (section.type === 'cards') {
      innerHTML += `<div class="domains-grid">`;
      section.items.forEach((item, idx) => {
        innerHTML += `
                    <div class="domain-card">
                        <div class="card-number">${(idx + 1).toString().padStart(2, '0')}</div>
                         <div class="card-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="${item.iconPath || 'M12 2v20M2 12h20'}"/>
                            </svg>
                        </div>
                        <h3>${item.title}</h3>
                        <p>${item.text}</p>
                    </div>
                `;
      });
      innerHTML += `</div>`;
    } else {
      innerHTML += section.content;
    }

    sectionEl.innerHTML = innerHTML;
    mainContent.appendChild(sectionEl);
  });
}

// Initial Render
document.addEventListener('DOMContentLoaded', renderPage);
