"use strict";

// ─── State ────────────────────────────────────────────────────
// Initialised to null; set properly on first render from dynamic year list
let activeYear      = null;
let activeSubsystem = "All";

// ─── Data ─────────────────────────────────────────────────────
const teamData = [
  {
    name: "Ananth Krishna",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2028",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: "https://www.linkedin.com/in/ananth-krishna-679060243", github: null, gmail: "ananth.ashwa@gmail.com" },
  },
  {
    name: "Dilan Da Silva",
    roles: ["Subsystem Lead"],
    subsystem: ["Sponsorship", "Marketing & Public Relations"],
    year: "2028",
    experience: "Newsletter Drafting Sponsor Outreach Launch Event and Student Induction Program Graphic Design Social Media",
    social: { linkedin: "https://www.linkedin.com/in/dilan-da-silva-a8297b32a", github: null, gmail: "dilandsilva.ashwa@gmail.com" },
    prototypes: {"Combustion": "Member / Part of team", "Electric": "Member / Part of team"},
  },
  {
    name: "Sughosha Rao R",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2028",
    experience: "Working on PCB designs including accumulator precharge circuits and brake light systems using pressure transducers.",
    social: { linkedin: null, github: null, gmail: "sughosharaor.ashwa@gmail.com" },
  },
  {
    name: "Dilraj Singh",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations", "IT"],
    year: "2028",
    experience: "Manages social media content and contributes to website development.",
    social: { linkedin: "https://www.linkedin.com/in/dilraj-singh-cos007", github: "https://github.com/Dilraj07", gmail: "dilrajsingh.ashwa@gmail.com" },
  },
  {
    name: "Praful P I",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2028",
    experience: "Member of the Brakes & Logistics subsystem.",
    social: { linkedin: null, github: null, gmail: "praful.ashwa@gmail.com" },
  },
  {
    name: "Ganesha K L",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2028",
    experience: "Member of the Suspension & Admin team.",
    social: { linkedin: "https://www.linkedin.com/in/ganesha-kalburgi-388042268", github: null, gmail: "ganeshakl.ashwa@gmail.com" },
  },
  {
    name: "Anarghya Hatti",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2028",
    experience: "Member of the Electrical & Testing subsystem.",
    social: { linkedin: "https://www.linkedin.com/in/anarghya-hatti-94a377251", github: null, gmail: "anarghya.ashwa@gmail.com" },
  },
  {
    name: "Lakshana Jeevanandan",
    roles: ["Member"],
    subsystem: ["Sponsorship", "Marketing & Public Relations", "Finance"],
    year: "2028",
    experience: "Lead Ashwa Racing’s newsletter, manage SMP documentation and Finance, and drive monetary sponsorship outreach. Developed and implemented Ashwa Racing’s documentation pipeline.",
    social: { linkedin: "https://www.linkedin.com/in/lakshana-jeevanandan-a1568432a", github: "https://github.com/lakshana009", gmail: "lakshana.ashwa@gmail.com" },
    prototypes: {"Electric": "Member / Part of team"},
  },
  {
    name: "K M Sri Raghava",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2028",
    experience: "Member of the Electrical & Testing subsystem.",
    social: { linkedin: "https://www.linkedin.com/in/sri-raghava-k-m-b8713433b", github: null, gmail: "raghava.ashwa@gmail.com" },
    prototypes: {"Electric": "Member / Part of team"},
  },
  {
    name: "Shrinidhi R",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2028",
    experience: "Member of the Suspension & Admin team.",
    social: { linkedin: "https://www.linkedin.com/in/shrinidhi-ramesh-852026341", github: null, gmail: "shrinidhir.ashwa@gmail.com" },
  },
  {
    name: "Heer Maloo",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Sponsorship, Marketing & Public Relations"],
    year: "2028",
    experience: "Member of the Drivetrain & HR and Sponsorship, Marketing & PR teams.",
    social: { linkedin: "https://www.linkedin.com/in/heer-maloo-490198260", github: "https://github.com/heermaloo03", gmail: "heermaloo.ashwa@gmail.com" },
  },
  {
    name: "Hansel Biju Mathew",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2028",
    experience: "Member of the Drivetrain & Human Resources team.",
    social: { linkedin: null, github: null, gmail: "hansel.ashwa@gmail.com" },
  },
  {
    name: "Pritha Nandy",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2028",
    experience: "Member of the Electrical & Testing subsystem.",
    social: { linkedin: null, github: null, gmail: "pritha.ashwa@gmail.com" },
  },
  {
    name: "Samyak Nahar",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2028",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: "https://www.linkedin.com/in/samyak-nahar-00709132b", github: null, gmail: "samyaknahar.ashwa@gmail.com" },
  },
  {
    name: "Prithvi Krishna Shambhu",
    roles: ["Subsystem Lead"],
    subsystem: ["Aero"],
    year: "2028",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: null, github: null, gmail: "prithviks.ashwa@gmail.com" },
    prototypes: {"Electric": "Member / Part of team"},
  },
  {
    name: "Shreni Shetty",
    roles: ["Subsystem Lead"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2028",
    experience: "Member of the Drivetrain & HR team.",
    social: { linkedin: "https://www.linkedin.com/in/shreni-shetty?utm_source=share_via&utm_content=profile&utm_medium=member_ios", github: "https://github.com/ShreniShetty", gmail: "shrenishetty.ashwa@gmail.com" },
    prototypes: {"Electric": "Member / Part of team"},
  },
  {
    name: "Ishita K. Bharadhwaj",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2028",
    experience: "Designed the accumulator mezzanine section and busbars housing safety and shutdown circuits, and manufactured the charging cart for the electric prototype.",
    social: { linkedin: "https://www.linkedin.com/in/ishita-bharadhwaj-b12741384", github: null, gmail: "ishitab.ashwa@gmail.com" },
  },
  {
    name: "Mrunal M",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2028",
    experience: "Member of the Electrical & Testing subsystem.",
    social: { linkedin: null, github: null, gmail: "mrunal.ashwa@gmail.com" },
  },
  {
    name: "Mayank S",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2028",
    experience: "Member of the Electrical & Testing subsystem.",
    social: { linkedin: null, github: null, gmail: "mayanks.ashwa@gmail.com" },
  },
  {
    name: "Sarah Das",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2028",
    experience: "Member of the Brakes & Logistics subsystem.",
    social: { linkedin: null, github: null, gmail: "sarahdas.ashwa@gmail.com" },
  },
  {
    name: "Arya Sunil",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2028",
    experience: "Contributes to both Engine development and Sponsorship & Marketing initiatives.",
    social: { linkedin: "https://www.linkedin.com/in/arya-sunil-a781a5318", github: null, gmail: "aryas.ashwa@gmail.com" },
  },
  {
    name: "Prajwal G Koli",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2028",
    experience: "Member of the Suspension & Admin team.",
    social: { linkedin: null, github: null, gmail: "prajwalgopalkashwa@gmail.com" },
  },
  {
    name: "Tejas Nagendra Naik",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2028",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: null, github: null, gmail: "tejasn.ashwa@gmail.com" },
  },
  {
    name: "Neil S Wesley",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2028",
    experience: "Assisted in procurement, basic manufacturing, and drafting administrative documents.",
    social: { linkedin: null, github: null, gmail: "neils.ashwa@gmail.com" },
  },
  {
    name: "Vinay Krishna B V",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations", "Finance"],
    year: "2028",
    experience: "Contributes to Sponsorship, Marketing & PR initiatives and financial operations.",
    social: { linkedin: "https://www.linkedin.com/in/vinay-krishna-b-v-182428317", github: null, gmail: "vinaykrishna.ashwa@gmail.com" },
  },
  {
    name: "Thanusha HU",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2028",
    experience: "Member of the Suspension & Admin team.",
    social: { linkedin: "https://www.linkedin.com/in/thanusha-h-u-438091354", github: null, gmail: "thanusha.ashwa@gmail.com" },
  },
  {
    name: "Priyansh Gupta",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2028",
    experience: "Member of the Sponsorship, Marketing & Public Relations team.",
    social: { linkedin: "https://www.linkedin.com/in/priyansh-gupta-a64328356", github: "https://github.com/prawnsgupta", gmail: "priyanshgupta.ashwa@gmail.com" },
  },
  {
    name: "Chakshu M Diwakar",
    roles: ["Member"],
    subsystem: ["Suspension & Admin", "Aero"],
    year: "2028",
    experience: "Currently developing a Lap-Time Simulator.",
    social: { linkedin: "https://www.linkedin.com/in/chakshu-m-diwakar-5a5777216", github: null, gmail: "chakshumd.ashwa@gmail.com" },
  },
  {
    name: "RZ-XX6-C",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management", "Suspension & Admin", "Drivetrain & Human Resources", "Brakes & Logistics", "Engine", "Electrical & Testing", "Sponsorship", "Marketing & Public Relations", "Finance", "IT", "Aero"],
    year: "2027",
    experience: "The car. She is heavy, but she is ours.",
    social: { linkedin: "https://www.linkedin.com/company/ashwa-racing/", github: "https://github.com/Ashwa-Racing", gmail: "rzxx6c.ashwa@gmail.com" },
    prototypes: {"Combustion": "Member / Part of team"},
  },
  {
    name: "N Akshay Urs",
    roles: ["Project Manager"],
    subsystem: ["Leads", "Electrical & Testing"],
    year: "2027",
    experience: "Designed Rear & Side IO. Worked on firmware for DAQ. Made the harness for RZ-XX6C. One of the drivers for the RZ-XX6C. Part of EDP team, achieving P5 at Formula Bharat 2026.",
    social: { linkedin: "https://www.linkedin.com/in/n-akshayurs/", github: null, gmail: null },
  },
  {
    name: "Sathvik S Naik",
    roles: ["Subsystem Lead", "Chief Engineer"],
    subsystem: ["Leads", "Chassis & Workshop Management"],
    year: "2027",
    experience: "Designed the LV enclosure and chassis. One of the drivers for the RZ-XX6C. Part of EDP team, achieving P5 at Formula Bharat 2026.",
    social: { linkedin: "https://www.linkedin.com/in/sathvik-s-naik-b186342a8/", github: null, gmail: null },
  },
  {
    name: "Vinith Prabhu",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2027",
    experience: "Designed the Power Distribution Board handling 300+ Watts of power around the car. Main proponent behind EDP position at Formula Bharat 2026, achieving P5 at Formula Bharat 2026. One of the drivers for the RZ-XX6C.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Shravan CS",
    roles: ["Subsystem Lead", "Team Captain"],
    subsystem: ["Leads", "Brakes & Logistics"],
    year: "2027",
    experience: "Leading the team as Captain while managing the Brakes & Logistics subsystem.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Anshul Joshi",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2027",
    experience: "Delivered exceptional suspension work within a tight timeline, ensuring RZ-XX6C stood on her own four wheels. Part of EDP team, achieving P5 at Formula Bharat 2026. Contributed to P6 finish at FB 2026.",
    social: { linkedin: "https://www.linkedin.com/in/an-joshi/", github: null, gmail: null },
  },
  {
    name: "Talin Thimmaiah",
    roles: ["Subsystem Lead"],
    subsystem: ["Engine"],
    year: "2027",
    experience: "Leading engine development and performance tuning for the 2027 race season. Worked on all engine components including sensors, ensuring reliable power output.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Ranjith DS",
    roles: ["Subsystem Lead"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2027",
    experience: "Designed drive shafts, DT Sprocket and other powertrain components. Part of EDP team, achieving P5 at Formula Bharat 2026.",
    social: { linkedin: "https://www.linkedin.com/in/ranjithds28/", github: null, gmail: null },
  },
  {
    name: "Aditeya Sarkar",
    roles: ["Subsystem Lead"],
    subsystem: ["Electrical & Testing", "IT"],
    year: "2027",
    experience: "Designed the BSPD. Worked on firmware for DAQ. Responsible for website design alongside IT 28.Part of BPP team, achieving 2nd Place at Formula Bharat 2026.",
    social: { linkedin: "https://www.linkedin.com/in/aditeya-sarkar/", github: "https://github.com/AditeyaDC", gmail: "aditeya.ashwa@gmail.com" },
    prototypes: {"Combustion": "Member / Part of team", "Driverless": "Member / Part of team"},
  },
  {
    name: "Pranav Ramakrishnan",
    roles: ["Subsystem Lead"],
    subsystem: ["Sponsorship, Marketing & Public Relations", "Finance"],
    year: "2027",
    experience: "Responsible for finances of RZ-XX6C. Part of BPP team, achieving P2 at Formula Bharat 2026.",
    social: { linkedin: "https://www.linkedin.com/in/pranav-ramakrishnan-387358297", github: null, gmail: "pranavramakrishnan.ashwa@gmail.com" },
  },
  {
    name: "Gaurav Raju",
    roles: ["Chief Engineer"],
    subsystem: ["Leads", "Chassis & Workshop Management"],
    year: "2026",
    experience: "Chief Engineer of the 2026 batch, leading the development of Ashwa Racing's first Electric Formula Student prototype.",
    social: { linkedin: "https://www.linkedin.com/in/gaurav-raju-9a2b92258", github: null, gmail: "gauravraju.ashwa@gmail.com" },
  },
  {
    name: "Vansh Vikas Jain",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2026",
    experience: "Secured 20+ sponsors including industry giants like Adani Group, Motul, Henkel, SKF, Delhivery, and BMC. Turns conversations into long-term collaborations, building partnerships that fuel performance on and off the track.",
    social: { linkedin: "https://www.linkedin.com/in/vansh-jain-a55b272b6", github: null, gmail: "vanshjain.ashwa@gmail.com" },
  },
  {
    name: "Hemanth",
    roles: ["Subsystem Lead"],
    subsystem: ["Brakes & Logistics"],
    year: "2026",
    experience: "Designed and manufactured an ergonomically optimized pedal assembly and implemented the team's first real-time brake bias adjuster, enabling dynamic brake force tuning.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sandeep N Uttarkar",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2026",
    experience: "Designed and developed the BMS/AMS architecture and supporting firmware for the vehicle.",
    social: { linkedin: "https://www.linkedin.com/in/sandeepnu0620/", github: "https://github.com/SandeepASHWARACING", gmail: "sandeepnuttarkar.ashwa@gmail.com" },
  },
  {
    name: "U P Madhavan",
    roles: ["Subsystem Lead"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2026",
    experience: "Manufacturing lead overseeing sponsor onboarding (10+ partners), fundraising, vendor selection, and procurement for machining and raw materials.",
    social: { linkedin: "https://www.linkedin.com/in/madhavan-pari-28651526b", github: null, gmail: "upmadhavan.ashwa@gmail.com" },
  },
  {
    name: "Vibin",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2026",
    experience: "Designed and implemented a 600W motor controller, laid the foundations for the AWD hub motor system, and developed the VCU and CAN watchdog.",
    social: { linkedin: "#", github: null, gmail: null },
    easterEgg: true,
  },
  {
    name: "Ravikiran K",
    roles: ["Member", "Team Captain"],
    subsystem: ["Sponsorship", "Marketing & Public Relations", "Leads"],
    year: "2025",
    experience: "Raised 5 lakhs and multiple sponsors for the team, 1st place BPP in Formula Bharat 2024, 2nd place Cost and Manufacturing Formula Bharat 2025, organised F1 simulator event in 8th mile 2023, Led Ashwa team of 2025,",
    social: { linkedin: null, github: null, gmail: "ravikiran.ashwa@gmail.com" },
    prototypes: {"Combustion": "Team Captain"},
    testimony: "My journey at Ashwa Racing was the most transformative experience of my life. I learnt volumes about team building, project management, leadership and so on while simultaneously discovering my own shortcomings and strengths. These experiences not only added to my knowledge base but also created lifelong memories which I will carry forward into through every walk of life. I have had the enormous privilege of leading an amazingly talented team of individuals and the journey has only fueled my drive to one day achieve the success I aspire towards.",
    currentJob: "MBA",
  },
  {
    name: "Chinmay Vanahalli",
    roles: ["Member", "Chief Engineer"],
    subsystem: ["Chassis & Workshop Management", "Leads"],
    year: "2025",
    experience: "Started my journey in Ashwa with hybrid project, we developed the Proof of Concept for a series-parallel hybrid powertrain, then helped with Hyperloop team for building Ashwa's first ever hyperloop pod. There, I contributed to the manufacturing and assembly of the pod and aeroshell. Signed off as Chief Engineer for the combustion prototype RZ-XX5C, leading the team through a successful campaign that saw the vehicle reach the endurance track at Formula Bharat 2025 and won 2nd place in Cost and manufacturing.",
    social: { linkedin: "https://www.linkedin.com/in/chinmay-v-ab703620b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", github: null, gmail: "chinmayv.ashwa@gmail.com" },
    prototypes: {"Combustion": "Chief Engineer", "Hybrid": "Member / Part of team", "Hyperloop": "Member / Part of team"},
    testimony: "My journey in Ashwa is something I will cherish forever. From the late-night manufacturing and testing sessions to the chaos of assembly or inventory session, the experience transformed me into a much better engineer. Being part of this team taught me to push my limits, thrive in a fast-paced environment, and truly understand my own strengths and weaknesses. Most importantly, Ashwa connected me with like-minded, hardworking individuals who are driven to achieve a common goal.",
    currentJob: "Product Engineer, Ather Energy",
  },
  {
    name: "Amish Srivastava",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2026",
    experience: "Kinematics and Geometry optimization, Spring rates, Anti roll bar design, Rocker design, Car setup",
    social: { linkedin: "https://www.linkedin.com/in/amish-s?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", github: null, gmail: "amish.ashwa@gmail.com" },
    prototypes: {"Electric": "Member / Part of team"},
  },
  {
    name: "Syed Nadeem",
    roles: ["Member"],
    subsystem: ["Sponsorship", "Marketing & Public Relations"],
    year: "2026",
    experience: "Helped raise sponsorship for both cv and ev cars. Finished in podium places in static events",
    social: { linkedin: "https://www.linkedin.com/in/syed-nadeem-30ab66264?utm_source=share_via&utm_content=profile&utm_medium=member_android", github: null, gmail: "syednadeem.ashwa@gmail.com" },
    prototypes: {"Combustion": "Member / Part of team", "Electric": "Member / Part of team"},
  },
  {
    name: "Dhruva Kashyap",
    roles: ["Subsystem Lead"],
    subsystem: ["Electrical & Testing"],
    year: "2026",
    experience: "Developed a data-centric vehicle system architecture on a modular DAQ and telemetry system. Designed DAQ, Power Unit, AMS Master, Precharge, and TSSI systems, among others. Contributed to the development of Electric Test Vehicle, Hyperloop, FS-XX6E and FS-XX6C prototypes.",
    social: { linkedin: null, github: null, gmail: "dhruva.ashwa@gmail.com" },
    prototypes: {"Electric": "Member / Part of team"},
  },
  {
    name: "Adithya Ranjith",
    roles: ["Subsystem Lead"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2026",
    experience: "Helped Design and Build the Drivetrain Architecture and System for the 2026 Electric Prototype.",
    social: { linkedin: "https://www.linkedin.com/in/adithyaranjith", github: null, gmail: "adithyaranjith.ashwa@gmail.com" },
    prototypes: {"Combustion": "Member / Part of team", "Electric": "Member / Part of team", "Hyperloop": "Member / Part of team"},
  },
  {
    name: "Zoeb Habib",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2005",
    experience: "Member of the Drivetrain & Human Resources team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "vivek ram",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2005",
    experience: "Member of the Electrical & Testing team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "venkat",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2005",
    experience: "Member of the Suspension & Admin team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "varun gandhi",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management", "Engine"],
    year: "2005",
    experience: "Member of the Chassis & Workshop Management and Engine team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "suneet sharma",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2005",
    experience: "Member of the Finance and Suspension & Admin team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "sajid",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2005",
    experience: "Member of the Finance and Suspension & Admin team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "shivakumar",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2005",
    experience: "Member of the Suspension & Admin team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "shravan",
    roles: ["Subsystem Lead"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2005",
    experience: "Subsystem Lead of the Engine and Sponsorship, Marketing & Public Relations team for the 2005 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "siddharth sivan",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2005",
    experience: "Member of the Suspension & Admin team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ramanan",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2005",
    experience: "Member of the Suspension & Admin team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ramachandran",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2005",
    experience: "Member of the Brakes & Logistics team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "muniraj",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2005",
    experience: "Member of the Chassis & Workshop Management team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "mruthyunjaya",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2005",
    experience: "Member of the Chassis & Workshop Management team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "karthik",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2005",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "kirit",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2005",
    experience: "Member of the Chassis & Workshop Management team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "manjunath",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2005",
    experience: "Member of the Chassis & Workshop Management team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "M.R Srinivas",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2005",
    experience: "Member of the Chassis & Workshop Management team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "basavashekar",
    roles: ["Subsystem Lead"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2005",
    experience: "Subsystem Lead of the Chassis & Workshop Management team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "anshul",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2005",
    experience: "Member of the Chassis & Workshop Management team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ashok",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2005",
    experience: "Member of the Chassis & Workshop Management team for the 2005 prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "arunraj subbaraj",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2005",
    experience: "Member of the Engine team for the 2005 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "arun kumar",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2005",
    experience: "Member of the Chassis & Workshop Management team for the 2005 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "vandit goyal",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics", "Finance"],
    year: "2006",
    experience: "Member of the Brakes & Logistics and Finance team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "subhadip sen gupta",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2006",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "shrikant shetty",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2006",
    experience: "Member of the Drivetrain & Human Resources team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "sarvesh srinivasan",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2006",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "praveen",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2006",
    experience: "Member of the Suspension & Admin team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "rahul chamaria",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2006",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "richard d cotto",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2006",
    experience: "Member of the Engine team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "pavan y v",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2006",
    experience: "Member of the Chassis & Workshop Management team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "nitin koshysam",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2006",
    experience: "Member of the Brakes & Logistics team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "MR srinivas",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2006",
    experience: "Member of the Chassis & Workshop Management team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "deepak v",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2006",
    experience: "Member of the Drivetrain & Human Resources team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "dhruv malhotra",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2006",
    experience: "Member of the Engine team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "harini ranga",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2006",
    experience: "Member of the Finance and Suspension & Admin team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "keerthan shetty",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2006",
    experience: "Member of the Suspension & Admin team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "laxshmisha k j",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2006",
    experience: "Member of the Chassis & Workshop Management team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "akshay sangolli",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2006",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "arunraj subbaraj",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2006",
    experience: "Member of the Engine team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ashok kumar",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management", "Engine"],
    year: "2006",
    experience: "Member of the Chassis & Workshop Management and Engine team for the 2006 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "vikram raghavan",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Finance"],
    year: "2007",
    experience: "Member of the Drivetrain & Human Resources and Finance team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "vandit goyal",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics", "Finance"],
    year: "2007",
    experience: "Member of the Brakes & Logistics and Finance team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "siddhart mandal",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2007",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "rajesh kumar mehta",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2007",
    experience: "Member of the Brakes & Logistics team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "saif saifuddin",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2007",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "sarvesh srinivasan",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2007",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "rahul chamaria",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2007",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "nitin koshysam",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2007",
    experience: "Member of the Brakes & Logistics team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "nikhil manjunath",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2007",
    experience: "Member of the Chassis & Workshop Management team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "mudit khanna",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2007",
    experience: "Member of the Drivetrain & Human Resources team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "harini ranga",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2007",
    experience: "Member of the Finance and Suspension & Admin team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "keerthan shetty",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2007",
    experience: "Member of the Engine team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "kshtij tandon",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2007",
    experience: "Member of the Brakes & Logistics team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "marvin saldhana",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2007",
    experience: "Member of the Engine team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "deepak kumar",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2007",
    experience: "Member of the Drivetrain & Human Resources team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "azeez sharif",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management", "Suspension & Admin"],
    year: "2007",
    experience: "Member of the Chassis & Workshop Management and Suspension & Admin team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "arunraj subbaraj",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2007",
    experience: "Member of the Chassis & Workshop Management team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "akshay sangolli",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2007",
    experience: "Member of the Chassis & Workshop Management team for the 2007 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Akshay Sangolli (Captain)",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2008",
    experience: "Member of the Chassis & Workshop Management team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Deepak Kumar",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics", "Chassis & Workshop Management"],
    year: "2008",
    experience: "Member of the Brakes & Logistics and Chassis & Workshop Management team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Azeez Sharif",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2008",
    experience: "Member of the Chassis & Workshop Management team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Marvin Saldhana",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2008",
    experience: "Member of the Engine team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Harini Ranga",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2008",
    experience: "Member of the Finance and Suspension & Admin team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Keerthan Shetty",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2008",
    experience: "Member of the Suspension & Admin team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Kshtij Tandon",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics", "Finance"],
    year: "2008",
    experience: "Member of the Brakes & Logistics and Finance team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rajesh Kumar Mehta",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2008",
    experience: "Member of the Brakes & Logistics team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Mudit Khanna",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Sponsorship, Marketing & Public Relations"],
    year: "2008",
    experience: "Member of the Drivetrain & Human Resources and Sponsorship, Marketing & Public Relations team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Nitin Koshy Sam",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2008",
    experience: "Member of the Suspension & Admin team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Nikhil Manjunath",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2008",
    experience: "Member of the Chassis & Workshop Management team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Saif Saifuddin",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2008",
    experience: "Member of the Chassis & Workshop Management team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rahul Chamaria",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2008",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Subhadip Sengupta",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2008",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Siddarth Mandal",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2008",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Vandit Goyal",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics", "Finance"],
    year: "2008",
    experience: "Member of the Brakes & Logistics and Finance team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sarvesh Srinivasan",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2008",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Vikram Raghavan",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2008",
    experience: "Member of the Drivetrain & Human Resources team for the 2008 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Ankit Sahu",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2009",
    experience: "Member of the Chassis & Workshop Management team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Aravind Sambamurthy",
    roles: ["Member"],
    subsystem: ["Electrical & Testing", "IT"],
    year: "2009",
    experience: "Member of the Electrical & Testing and IT team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Bharath Swaminathan",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Sponsorship, Marketing & Public Relations"],
    year: "2009",
    experience: "Member of the Drivetrain & Human Resources and Sponsorship, Marketing & Public Relations team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Datta N",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Sponsorship, Marketing & Public Relations"],
    year: "2009",
    experience: "Member of the Drivetrain & Human Resources and Sponsorship, Marketing & Public Relations team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Keerthan Shetty",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Sponsorship, Marketing & Public Relations"],
    year: "2009",
    experience: "Member of the Drivetrain & Human Resources and Sponsorship, Marketing & Public Relations team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Manjunath Anand",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2009",
    experience: "Member of the Chassis & Workshop Management team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Mudit Khanna",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Sponsorship, Marketing & Public Relations"],
    year: "2009",
    experience: "Member of the Drivetrain & Human Resources and Sponsorship, Marketing & Public Relations team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Nanda Gopalan",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics", "Suspension & Admin"],
    year: "2009",
    experience: "Member of the Brakes & Logistics and Suspension & Admin team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Navdeep Singh",
    roles: ["Team Captain"],
    subsystem: ["Engine"],
    year: "2009",
    experience: "Team Captain of the Engine team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rajit Malik",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2009",
    experience: "Member of the Chassis & Workshop Management team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sharath Sreedharan",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2009",
    experience: "Member of the Brakes & Logistics team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Shubham Saurav",
    roles: ["Chief Engineer"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2009",
    experience: "Chief Engineer of the Chassis & Workshop Management team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Siddarth Mandal",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2009",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sirish Vissa",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Sponsorship, Marketing & Public Relations"],
    year: "2009",
    experience: "Member of the Drivetrain & Human Resources and Sponsorship, Marketing & Public Relations team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sri Ganesh Sriram",
    roles: ["Member"],
    subsystem: ["Electrical & Testing", "IT"],
    year: "2009",
    experience: "Member of the Electrical & Testing and IT team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Vandit Goyal",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Sponsorship, Marketing & Public Relations"],
    year: "2009",
    experience: "Member of the Drivetrain & Human Resources and Sponsorship, Marketing & Public Relations team for the 2009 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Abhinit Lal",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2010",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Achal Raghavan",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2010",
    experience: "Member of the Chassis & Workshop Management team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Aniket Prabudha",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Finance"],
    year: "2010",
    experience: "Member of the Drivetrain & Human Resources and Finance team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Ankit Ratna",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2010",
    experience: "Member of the Finance and Suspension & Admin team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Arunraj Subbaraj",
    roles: ["Member"],
    subsystem: ["Finance", "Sponsorship, Marketing & Public Relations"],
    year: "2010",
    experience: "Member of the Finance and Sponsorship, Marketing & Public Relations team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Keerthan Shetty",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2010",
    experience: "Member of the Chassis & Workshop Management team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Madhur Khadbadi",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2010",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Mayur Gowda",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2010",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Nikhil Jali",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2010",
    experience: "Member of the Electrical & Testing team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Prabhu Dev",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2010",
    experience: "Member of the Finance and Suspension & Admin team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Prashanth",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2010",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rahul Anand",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources", "Sponsorship, Marketing & Public Relations"],
    year: "2010",
    experience: "Member of the Drivetrain & Human Resources and Sponsorship, Marketing & Public Relations team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Raylan Vaz",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2010",
    experience: "Member of the Brakes & Logistics team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sharath Kumar P",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2010",
    experience: "Member of the Chassis & Workshop Management team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Shravan Tirumalai",
    roles: ["Team Captain"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2010",
    experience: "Team Captain of the Drivetrain & Human Resources team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Siddarth Mandal",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2010",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sirish Vissa",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2010",
    experience: "Member of the Chassis & Workshop Management team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sriman Kumar",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2010",
    experience: "Member of the Finance and Suspension & Admin team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Utsav Kumar",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2010",
    experience: "Member of the Brakes & Logistics team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Vandit Goyal",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2010",
    experience: "Member of the Chassis & Workshop Management team for the 2010 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "JEET SHETH",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2011",
    experience: "Member of the Suspension & Admin team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "KARAN GUPTA",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2011",
    experience: "Member of the Suspension & Admin team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "KUNAL GOEL",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2011",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "KUSHAGRA PANDA",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2011",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "MANASVI MOHAN",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2011",
    experience: "Member of the Electrical & Testing team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "MEHUL CHHAPIA",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2011",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "NISHANT JAIN",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2011",
    experience: "Member of the Brakes & Logistics team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "OSHO MAHARAJA",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2011",
    experience: "Member of the Drivetrain & Human Resources team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "PRABHJEET SINGH",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2011",
    experience: "Member of the Chassis & Workshop Management team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "RAJ GAURAV",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2011",
    experience: "Member of the Chassis & Workshop Management team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SUHAS AITHAL",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2011",
    experience: "Member of the Brakes & Logistics team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SUHAS ATHREY",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2011",
    experience: "Member of the Finance and Suspension & Admin team for the 2011 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ANKIT JAJODIA",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2012",
    experience: "Member of the Finance and Suspension & Admin team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ANKUR REVANKAR",
    roles: ["Chief Engineer"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2012",
    experience: "Chief Engineer of the Chassis & Workshop Management team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ARPIT AGARWAL",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2012",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "GOPIKA HEMACHANDER",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2012",
    experience: "Member of the Finance and Suspension & Admin team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "JAYESH CHANDIRAMANI",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2012",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "KANAL SEBASTIAN",
    roles: ["Team Captain"],
    subsystem: ["Suspension & Admin"],
    year: "2012",
    experience: "Team Captain of the Suspension & Admin team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "KSHITIJ PURI",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2012",
    experience: "Member of the Drivetrain & Human Resources team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "NAVEEN PRASAD",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2012",
    experience: "Member of the Brakes & Logistics team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "RAMCHANDER GANAPATHY",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2012",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "RANGARAJU DATLA",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2012",
    experience: "Member of the Drivetrain & Human Resources team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SANJAM BHANDARI",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2012",
    experience: "Member of the Electrical & Testing team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SAURABH KUMAR",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2012",
    experience: "Member of the Chassis & Workshop Management team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SIVA SUBRAMANIAN",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2012",
    experience: "Member of the Electrical & Testing team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "VARUN PRABHU",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2012",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ZOISH TOSHER HORMUSJEE",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2012",
    experience: "Member of the Brakes & Logistics team for the 2012 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "AJAY KUMAR",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2014",
    experience: "Member of the Suspension & Admin team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "AKASH PAL",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2014",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "GAUTHAM SUNDER",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2014",
    experience: "Member of the Brakes & Logistics team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "GOKUL KRISHNA",
    roles: ["Chief Engineer"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2014",
    experience: "Chief Engineer of the Chassis & Workshop Management team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "KUNAL MEHTA",
    roles: ["Member"],
    subsystem: ["Electrical & Testing", "Finance"],
    year: "2014",
    experience: "Member of the Electrical & Testing and Finance team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "MANAN GHELANI",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2014",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "MD SAMRAN IQBAL",
    roles: ["Member"],
    subsystem: ["Electrical & Testing", "Finance"],
    year: "2014",
    experience: "Member of the Electrical & Testing and Finance team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "NIKHIL NEEDAGI",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2014",
    experience: "Member of the Drivetrain & Human Resources team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SANGRAM ROUT",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2014",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SHARATH VASISHTA",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2014",
    experience: "Member of the Suspension & Admin team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SIDDARTH GAUTHAM",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2014",
    experience: "Member of the Chassis & Workshop Management team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "TEJAS BABARIA",
    roles: ["Team Captain"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2014",
    experience: "Team Captain of the Sponsorship, Marketing & Public Relations team for the 2014 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ABHINANDAN VISWANATH",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2015",
    experience: "Member of the Chassis & Workshop Management team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ABHISHEK C SHEKAR",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2015",
    experience: "Member of the Chassis & Workshop Management team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ADITYA SUDHAKAR",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2015",
    experience: "Member of the Drivetrain & Human Resources team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ANUSH CHAKRAVARTHI",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2015",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "MANJEETH R",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2015",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "MOHIT LAL",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2015",
    experience: "Member of the Electrical & Testing team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "PAVAN N REDDY",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2015",
    experience: "Member of the Brakes & Logistics team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SACHIN MALAGAVI",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2015",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SAICHAND",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2015",
    experience: "Member of the Brakes & Logistics team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SAIF AZIZ ABSAR",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2015",
    experience: "Member of the Electrical & Testing team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "VADIRAJ PATIL",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2015",
    experience: "Member of the Chassis & Workshop Management team for the 2015 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Aakash Maskara",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2016",
    experience: "Member of the Suspension & Admin team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Ankur Jairath",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2016",
    experience: "Member of the Drivetrain & Human Resources team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Anshul Dhadkar",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2016",
    experience: "Member of the Suspension & Admin team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Ayush Pandey",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2016",
    experience: "Member of the Chassis & Workshop Management team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Biswajit Roy",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2016",
    experience: "Member of the Electrical & Testing team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Chandrakant Choppa",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2016",
    experience: "Member of the Electrical & Testing team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Deeksha Bhagat",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2016",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "GY Rohith Gajula",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2016",
    experience: "Member of the Chassis & Workshop Management team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Karan Chatrath",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2016",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Krishna Kashyap Singh",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2016",
    experience: "Member of the Chassis & Workshop Management team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Mohammed Hannan Chishti",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2016",
    experience: "Member of the Finance and Suspension & Admin team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Naramsetty Vamsi",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2016",
    experience: "Member of the Brakes & Logistics team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Pallav Rawat",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2016",
    experience: "Member of the Brakes & Logistics team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rajat Kabra",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2016",
    experience: "Member of the Drivetrain & Human Resources team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rishav Ranjan",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2016",
    experience: "Member of the Suspension & Admin team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Vikas Jeevanagar",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2016",
    experience: "Member of the Electrical & Testing team for the 2016 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Abdul Rehman",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2017",
    experience: "Member of the Chassis & Workshop Management team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Abin Vincent",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2017",
    experience: "Member of the Finance and Suspension & Admin team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Aishwarya Bhatt",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2017",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Anushree H N",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2017",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Gokul Suresh",
    roles: ["Team Captain"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2017",
    experience: "Team Captain of the Drivetrain & Human Resources team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Govind Shenoy",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2017",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Kiran B M",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2017",
    experience: "Member of the Electrical & Testing team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Lalith Keerthan",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2017",
    experience: "Member of the Electrical & Testing team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Nidith Rai",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2017",
    experience: "Member of the Suspension & Admin team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Pranav Narahari",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2017",
    experience: "Member of the Engine team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Pranith Prasanna",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2017",
    experience: "Member of the Brakes & Logistics team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Pranjal Tyagi",
    roles: ["Chief Engineer"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2017",
    experience: "Chief Engineer of the Chassis & Workshop Management team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Raghu Vamsi",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2017",
    experience: "Member of the Chassis & Workshop Management team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rounak Maru",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2017",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Shamveel Mohammed",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2017",
    experience: "Member of the Brakes & Logistics team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sohan Shetty",
    roles: ["Project Manager"],
    subsystem: ["Suspension & Admin"],
    year: "2017",
    experience: "Project Manager of the Suspension & Admin team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Upendra Arun",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2017",
    experience: "Member of the Suspension & Admin team for the 2017 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ASHISH NAIR",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2018",
    experience: "Member of the Finance and Suspension & Admin team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ATIQH AHMED",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2018",
    experience: "Member of the Suspension & Admin team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "DHANUSH S B",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2018",
    experience: "Member of the Electrical & Testing team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "MOHIT KONGAT NAIR",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2018",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "NISCHAY JAIN",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2018",
    experience: "Member of the Brakes & Logistics team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "PRATEEK BHUSTALI",
    roles: ["Chief Engineer"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2018",
    experience: "Chief Engineer of the Chassis & Workshop Management team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "RABINDRANATH MUKHERJEE",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2018",
    experience: "Member of the Engine team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "RAKESH H N",
    roles: ["Project Manager"],
    subsystem: ["Suspension & Admin"],
    year: "2018",
    experience: "Project Manager of the Suspension & Admin team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SARTHAK KRISHNA",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2018",
    experience: "Member of the Electrical & Testing team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SHRIDHAR GANIGER",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2018",
    experience: "Member of the Electrical & Testing team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SHRIRANG AGRAWAL",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2018",
    experience: "Member of the Chassis & Workshop Management team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SIDHARTHA SAHU",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2018",
    experience: "Member of the Engine team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SWEEKRUTH SHETTY",
    roles: ["Team Captain"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2018",
    experience: "Team Captain of the Drivetrain & Human Resources team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "VARUN V V",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2018",
    experience: "Member of the Chassis & Workshop Management team for the 2018 (Combustion) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "AMOL MEHTA",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2019",
    experience: "Member of the Brakes & Logistics team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "ASFAN KHAN",
    roles: ["Team Captain"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2019",
    experience: "Team Captain and member of the Drivetrain & Human Resources team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "C R SRINIVAS",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2019",
    experience: "Member of the Electrical & Testing team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "DENZIL A JOY",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2019",
    experience: "Member of the Engine team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "DHRUV BHANDARI",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2019",
    experience: "Member of the Engine team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "GAUTAM SINGH",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2019",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "K PRANEET",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2019",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "KOMAL JAIN",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2019",
    experience: "Member of the Sponsorship, Marketing & Public Relations team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "MOKSHITH BOHRA",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2019",
    experience: "Member of the Suspension & Admin team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "N V UDAY",
    roles: ["Chief Engineer"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2019",
    experience: "Chief Engineer and member of the Chassis & Workshop Management team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "NEHAL BALACHANDRAN",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2019",
    experience: "Member of the Electrical & Testing team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "NITHIN M BANAKAR",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2019",
    experience: "Member of the Electrical & Testing team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "PRANAVE NANDA",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2019",
    experience: "Member of the Drivetrain & Human Resources team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "PRASHANTH TEJAS",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2019",
    experience: "Member of the Brakes & Logistics team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "RAHUL DEVAMANI",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2019",
    experience: "Member of the Suspension & Admin team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SRIVATSA DESHPANDE",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2019",
    experience: "Member of the Sponsorship, Marketing & Public Relations team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "SUHAS B U",
    roles: ["Project Manager"],
    subsystem: ["Suspension & Admin"],
    year: "2019",
    experience: "Project Manager and member of the Suspension & Admin team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "TARUN KASA",
    roles: ["Subsystem Lead"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2019",
    experience: "Subsystem Lead of the Sponsorship, Marketing & Public Relations team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "UTKARSH AGARWAL",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2019",
    experience: "Member of the Finance and Suspension & Admin team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "VENKATARAMANA DATTA",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2019",
    experience: "Member of the Brakes & Logistics team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "YOGESH KUMAR",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2019",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Bharat Elangovel",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2020",
    experience: "Member of Suspension & Admin",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Shreyash",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2020",
    experience: "Member of the Finance and Suspension & Admin team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Siddharth Reddy",
    roles: ["Chief Engineer", "Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2020",
    experience: "Chief Engineer of the Finance and Suspension & Admin team",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sathvik Shetty",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2020",
    experience: "Member of the Drivetrain & Human Resources team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Bharat Talikoti",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2020",
    experience: "Member of the Drivetrain & Human Resources team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Ruthuarna",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2020",
    experience: "Member of the Brakes & Logistics team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Manjunath BD",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2020",
    experience: "Member of the Brakes & Logistics team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Hariharan",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2020",
    experience: "Member of the Sponsorship, Marketing & Public Relations team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Manasi Kadambi",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2020",
    experience: "Member of the Sponsorship, Marketing & Public Relations team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Harshita",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2020",
    experience: "Member of the Sponsorship, Marketing & Public Relations team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Harish",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2020",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Shashank",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2020",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Anirudh",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2020",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Chinmay",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2020",
    experience: "Member of the Chassis & Workshop Management team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Goutham",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2020",
    experience: "Member of the Electrical & Testing team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Dattatraya",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2020",
    experience: "Member of the Electrical & Testing team.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Aakash Maskara",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2015",
    experience: "Member of the Suspension & Admin team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Ankur Jairath",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2015",
    experience: "Member of the Drivetrain & Human Resources team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Anshul Dhadkar",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2015",
    experience: "Member of the Drivetrain & Human Resources team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Ayush Pandey",
    roles: ["Chief Engineer"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2015",
    experience: "Chief Engineer of the Chassis & Workshop Management team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Biswajit Roy",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2015",
    experience: "Member of the Electrical & Testing team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Chandrakant Choppa",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2015",
    experience: "Member of the Electrical & Testing team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Deeksha Bhagat",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2015",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "GY Rohith Gajula",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2015",
    experience: "Member of the Chassis & Workshop Management team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Karan Chatrath",
    roles: ["Member"],
    subsystem: ["Engine", "Sponsorship, Marketing & Public Relations"],
    year: "2015",
    experience: "Member of the Engine and Sponsorship, Marketing & Public Relations team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Krishna Kashyap Singh",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2015",
    experience: "Member of the Chassis & Workshop Management team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Mohammed Hannan Chishti",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2015",
    experience: "Member of the Finance and Suspension & Admin team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Naramsetty Vamsi",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2015",
    experience: "Member of the Brakes & Logistics team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Pallav Rawat",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2015",
    experience: "Member of the Brakes & Logistics team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rajat Kabra",
    roles: ["Team Captain"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2015",
    experience: "Team Captain of the Drivetrain & Human Resources team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rishav Ranjan",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2015",
    experience: "Member of the Suspension & Admin team for the 2015 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Abdul Rehman",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2016",
    experience: "Member of the Chassis & Workshop Management team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Abin Vincent",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2016",
    experience: "Member of the Finance and Suspension & Admin team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Aishwarya Bhatt",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2016",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Anushree H N",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2016",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Gokul Suresh",
    roles: ["Team Captain"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2016",
    experience: "Team Captain of the Drivetrain & Human Resources team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Govind Shenoy",
    roles: ["Subsystem Lead"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2016",
    experience: "Subsystem Lead of the Sponsorship, Marketing & Public Relations team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Kiran B.M.",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2016",
    experience: "Member of the Electrical & Testing team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Lalith Keerthan",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2016",
    experience: "Member of the Electrical & Testing team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Nidhith Rai",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2016",
    experience: "Member of the Suspension & Admin team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Pranav Narahari",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2016",
    experience: "Member of the Engine team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Pranith Prasanna",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2016",
    experience: "Member of the Brakes & Logistics team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Pranjal Tyagi",
    roles: ["Chief Engineer"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2016",
    experience: "Chief Engineer of the Chassis & Workshop Management team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Raghu Vamsi",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2016",
    experience: "Member of the Brakes & Logistics team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rounak Maru",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2016",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Santosh V N",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2016",
    experience: "Member of the Brakes & Logistics team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Shamveel Mohammed",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2016",
    experience: "Member of the Brakes & Logistics team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sohan Shetty",
    roles: ["Project Manager"],
    subsystem: ["Suspension & Admin"],
    year: "2016",
    experience: "Project Manager of the Suspension & Admin team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Upendra Arun",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2016",
    experience: "Member of the Suspension & Admin team for the 2016 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Ashish Nair",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2017",
    experience: "Member of the Finance and Suspension & Admin team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Atiqh Ahmed",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2017",
    experience: "Member of the Suspension & Admin team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Dhansush SB",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2017",
    experience: "Member of the Electrical & Testing team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Mohit Kongat Nair",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2017",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Nischay Jain",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2017",
    experience: "Member of the Brakes & Logistics team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Prateek Bhustali",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2017",
    experience: "Member of the Chassis & Workshop Management team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rakesh HN",
    roles: ["Project Manager"],
    subsystem: ["Suspension & Admin"],
    year: "2017",
    experience: "Project Manager of the Suspension & Admin team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rabindranath Mukherjee",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2017",
    experience: "Member of the Engine team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sarthak Krishna",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2017",
    experience: "Member of the Engine team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Shridhar Ganiger",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2017",
    experience: "Member of the Electrical & Testing team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Shrirang Agarwal",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2017",
    experience: "Member of the Chassis & Workshop Management team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sidhartha Sahu",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2017",
    experience: "Member of the Engine team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sweekruth Shetty",
    roles: ["Team Captain"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2017",
    experience: "Team Captain of the Drivetrain & Human Resources team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Varun VV",
    roles: ["Chief Engineer"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2017",
    experience: "Chief Engineer of the Chassis & Workshop Management team for the 2017 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Amol Mehta",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2018",
    experience: "Member of the Brakes & Logistics team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Asfan Khan",
    roles: ["Team Captain"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2018",
    experience: "Team Captain of the Drivetrain & Human Resources team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Danvin",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2018",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Denzil Joel",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2018",
    experience: "Member of the Engine team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Dhruv Bhandari",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2018",
    experience: "Member of the Engine team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Gautam Singh",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2018",
    experience: "Member of the Chassis & Workshop Management team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Komal",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2018",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Mokshit",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2018",
    experience: "Member of the Suspension & Admin team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Nehal",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2018",
    experience: "Member of the Electrical & Testing team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Nithin",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2018",
    experience: "Member of the Electrical & Testing team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Pranave Nanda",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2018",
    experience: "Member of the Drivetrain & Human Resources team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Srivatsa",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2018",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Srinivas",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2018",
    experience: "Member of the Electrical & Testing team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Suhas BU",
    roles: ["Project Manager"],
    subsystem: ["Suspension & Admin"],
    year: "2018",
    experience: "Project Manager of the Suspension & Admin team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Tarun Kasa",
    roles: ["Subsystem Lead"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2018",
    experience: "Subsystem Lead of the Sponsorship, Marketing & Public Relations team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Uday V Naik",
    roles: ["Chief Engineer"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2018",
    experience: "Chief Engineer of the Chassis & Workshop Management team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Utkarsh",
    roles: ["Member"],
    subsystem: ["Finance", "Suspension & Admin"],
    year: "2018",
    experience: "Member of the Finance and Suspension & Admin team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Venkateshwara Dutta",
    roles: ["Member"],
    subsystem: ["Brakes & Logistics"],
    year: "2018",
    experience: "Member of the Brakes & Logistics team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Yogesh",
    roles: ["Member"],
    subsystem: ["Chassis & Workshop Management"],
    year: "2018",
    experience: "Member of the Chassis & Workshop Management team for the 2018 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Smith Patel",
    roles: ["Member"],
    subsystem: ["Suspension & Admin"],
    year: "2019",
    experience: "Member of the Suspension & Admin team for the 2019 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rhea",
    roles: ["Member"],
    subsystem: ["Drivetrain & Human Resources"],
    year: "2019",
    experience: "Member of the Drivetrain & Human Resources team for the 2019 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Nachiket",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2019",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2019 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Rishika",
    roles: ["Member"],
    subsystem: ["Sponsorship, Marketing & Public Relations"],
    year: "2019",
    experience: "Member of the Sponsorship, Marketing & Public Relations team for the 2019 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sahil",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2019",
    experience: "Member of the Electrical & Testing team for the 2019 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Ayan",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2019",
    experience: "Member of the Engine team for the 2019 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Aditya",
    roles: ["Member"],
    subsystem: ["Engine"],
    year: "2019",
    experience: "Member of the Engine team for the 2019 (Hybrid) prototype.",
    social: { linkedin: null, github: null, gmail: null },
  },
  {
    name: "Sanketh Kanarlaparti",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2028",
    experience: "Worked with motor controller and discharge circuit",
    social: { linkedin: "https://www.linkedin.com/in/sanketh-k-865623279?utm_source=share_via&utm_content=profile&utm_medium=member_android", github: null, gmail: "sanketh.ashwa@gmail.com" },
    prototypes: {"Electric": "Member / Part of team"},
  },
  {
    name: "K Chinmay",
    roles: ["Member"],
    subsystem: ["Electrical & Testing"],
    year: "2028",
    experience: "",
    social: { linkedin: null, github: null, gmail: "kchinmay.ashwa@gmail.com" },
  },
  {
    name: "Aitijhya Sahoo",
    roles: ["Subsystem Lead"],
    subsystem: ["Suspension & Admin"],
    year: "2027",
    experience: "Vehicle Dynamics Lead, with the team responsible for the design, analysis, testing, and maintenance of the vehicle’s suspension system and its components. Contributed to suspension geometry development, hardpoint optimization, component design, performance analysis, and validation to improve vehicle handling, stability, and overall dynamic performance.",
    social: { linkedin: "https://www.linkedin.com/in/aitijhya", github: null, gmail: "aitijhya.ashwa@gmail.com" },
    prototypes: {"Combustion": "Member / Part of team"},
  },
];

// ─── DOM refs ──────────────────────────────────────────────────
const grid        = document.getElementById("member-profiles-grid");
const countEl     = document.getElementById("member-count");
const descBox     = document.getElementById("subsystem-desc");
const rosterHeading = document.getElementById("roster-heading");
const yearFilter  = document.getElementById("year-filter");
const subFilter   = document.getElementById("subsystem-filter");

const PROFILE_BASE           = "assets/images/team/members/";
const DEFAULT_PROFILE_IMAGE  = "https://assets.ashwaracing.org/images/team/default.webp";

// ─── Role Classification ───────────────────────────────────────
// Returns the highest-authority role class for a member
function getRoleClass(member) {
  const roles = member.roles.map(r => r.toLowerCase());
  const isCommand =
    roles.some(r => r.includes("team captain") || r.includes("chief engineer") || r.includes("project manager"));
  const isLead =
    !isCommand && roles.some(r => r.includes("lead"));
  if (isCommand) return "is-command";
  if (isLead)    return "is-lead";
  return "";
}

// Human-readable badge text for top roles
function getBadgeText(member) {
  const roles = member.roles.map(r => r.toLowerCase());
  if (roles.some(r => r.includes("team captain")))   return { text: "Team Captain",   cls: "badge-command" };
  if (roles.some(r => r.includes("chief engineer"))) return { text: "Chief Engineer", cls: "badge-command" };
  if (roles.some(r => r.includes("project manager"))) return { text: "Project Manager", cls: "badge-command" };
  if (roles.some(r => r.includes("lead")))           return { text: "Subsystem Lead", cls: "badge-lead" };
  return null;
}

// ─── Card Builder ──────────────────────────────────────────────
function createMemberCard(member) {
  const card = document.createElement("div");
  card.classList.add("member-card");

  const roleClass = getRoleClass(member);
  if (roleClass) card.classList.add(roleClass);

  const imgPath = member.image
    ? (member.image.startsWith("http") ? member.image : `${PROFILE_BASE}${member.year}/${member.image.split("/").pop()}`)
    : `${PROFILE_BASE}${member.year}/${member.name}.webp`;

  // Social links
  const linkedinLink = member.social.linkedin && member.social.linkedin !== "#"
    ? `<a href="${member.social.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>`
    : "";
  const githubLink = member.social.github
    ? `<a href="${member.social.github}" target="_blank" rel="noopener" aria-label="GitHub"><i class="fab fa-github"></i></a>`
    : "";
  const gmailLink = member.social.gmail
    ? `<a href="mailto:${member.social.gmail}" aria-label="Email"><i class="fas fa-envelope"></i></a>`
    : "";

  // Role badge HTML
  const badge = getBadgeText(member);
  const badgeHTML = badge
    ? `<div class="role-badge ${badge.cls}">${badge.text}</div>`
    : "";

  // Easter egg canvas
  const easterEggCanvas = member.easterEgg
    ? `<div class="member-3d"><canvas></canvas></div>`
    : "";

  // Subsystem display — strip duplicate entries cleanly
  const uniqueSubs = [...new Set(member.subsystem)].join(" · ");

  card.innerHTML = `
    ${easterEggCanvas}

    <div class="profile-header">
      <div class="profile-img-container">
        <img
          src="${imgPath}"
          alt="Photo of ${member.name}"
          loading="lazy"
          class="member-img"
        >
      </div>
      ${badgeHTML}
      <div class="profile-info-overlay">
        <p class="member-name">${member.name}</p>
        <p class="member-role">${member.roles.join(" · ")}</p>
        <p class="member-subsystem">${uniqueSubs}</p>
      </div>
    </div>

    <div class="member-experience">
      <div class="exp-label">Contribution</div>
      <p>${member.experience}</p>
    </div>

    <div class="member-social">
      ${linkedinLink}
      ${githubLink}
      ${gmailLink}
    </div>
  `;

  // Image error fallback — try space/underscore x webp/jpg combos, then default
  const img = card.querySelector(".member-img");
  img.addEventListener("error", function () {
    if (this.src.includes("default.webp")) return;

    const stages = ["underscore-webp", "space-jpg", "underscore-jpg", "default"];
    const current = this.dataset.stage;
    const nextStage = current ? stages[stages.indexOf(current) + 1] : stages[0];

    const base = imgPath.slice(0, imgPath.lastIndexOf("/") + 1);
    const nameWithSpaces = member.name;
    const nameWithUnderscores = member.name.replace(/ /g, "_");

    switch (nextStage) {
      case "underscore-webp":
        this.src = `${base}${nameWithUnderscores}.webp`;
        break;
      case "space-jpg":
        this.src = `${base}${nameWithSpaces}.jpg`;
        break;
      case "underscore-jpg":
        this.src = `${base}${nameWithUnderscores}.jpg`;
        break;
      case "default":
      default:
        this.src = DEFAULT_PROFILE_IMAGE;
        break;
    }

    this.dataset.stage = nextStage;
  });

  return card;
}

// ─── Sort order ────────────────────────────────────────────────
// Command > Lead > Member
function roleSortWeight(member) {
  const cls = getRoleClass(member);
  if (cls === "is-command") return 0;
  if (cls === "is-lead")    return 1;
  return 2;
}

// ─── Render ────────────────────────────────────────────────────
function renderMembers(year, subsystem) {
  grid.style.opacity = "0";

  setTimeout(() => {
    grid.innerHTML = "";

    const results = teamData
      .filter(m =>
        m.year === year &&
        (subsystem === "All" || m.subsystem.includes(subsystem))
      )
      .sort((a, b) => roleSortWeight(a) - roleSortWeight(b));

    // Update count
    if (countEl) {
      countEl.textContent = results.length
        ? `${results.length} member${results.length !== 1 ? "s" : ""}`
        : "—";
    }

    // Update dynamic heading
    if (rosterHeading) {
      const sub = subsystem === "All" ? "Full Team" : subsystem;
      rosterHeading.textContent = `${sub} — ${year}`;
    }

    if (results.length === 0) {
      grid.innerHTML = `
        <div class="no-members">
          <i class="fas fa-users-slash"></i>
          <p>No members found for this filter.</p>
        </div>`;
    } else {
      results.forEach((member, i) => {
        const card = createMemberCard(member);
        card.style.animationDelay = `${i * 0.055}s`;

        if (member.easterEgg) {
          card.classList.add("easter-egg");
          initCard3D(card);
        }

        grid.appendChild(card);
      });
    }

    grid.style.opacity = "1";
  }, 160);
}

// ─── 3D Easter Egg ────────────────────────────────────────────
function initCard3D(card) {
  const canvas = card.querySelector(".member-3d canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 2.5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

  function resize() {
    const r = card.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }

  resize();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.2));

  const loader = new THREE.TextureLoader();
  const tex    = loader.load(
    "https://assets.ashwaracing.org/images/team/members/2026/easteregg.png",
    () => renderer.render(scene, camera)
  );

  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const mat  = new THREE.MeshStandardMaterial({ map: tex });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [mat, mat, mat, mat, mat, mat]);
  scene.add(cube);

  let running = false;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    cube.rotation.y += 0.01;
    cube.rotation.x += 0.005;
    renderer.render(scene, camera);
  }

  card.addEventListener("mouseenter", () => { resize(); running = true; animate(); });
  card.addEventListener("mouseleave", () => { running = false; });
}

// ─── Filter Scroll Helper ─────────────────────────────────────
function scrollStep(direction, wrapper, items) {
  let activeIdx = -1;
  for (let i = 0; i < items.length; i++) {
    if (items[i].querySelector?.(".filter-btn.active")) { activeIdx = i; break; }
  }
  if (activeIdx === -1) activeIdx = 1;

  let target = activeIdx + direction;
  const last = items.length - 1;
  if (target <= 0)    target = 1;
  if (target >= last) target = last - 1;

  const el = items[target];
  const x  = el.offsetLeft - wrapper.clientWidth / 2 + el.clientWidth / 2;
  wrapper.scroll({ left: x, behavior: "smooth" });
  el.querySelector(".filter-btn")?.click();
}

// ─── Arrow Buttons ────────────────────────────────────────────
document.getElementById("year-left").onclick  = () => scrollStep(-1, yearFilter, yearFilter.children);
document.getElementById("year-right").onclick = () => scrollStep( 1, yearFilter, yearFilter.children);
document.getElementById("subsystem-left").onclick  = () => scrollStep(-1, subFilter, subFilter.children);
document.getElementById("subsystem-right").onclick = () => scrollStep( 1, subFilter, subFilter.children);

// ─── Wheel Scroll ─────────────────────────────────────────────
yearFilter.addEventListener("wheel", e => {
  e.preventDefault();
  scrollStep(e.deltaY > 0 ? 1 : -1, yearFilter, yearFilter.children);
});
subFilter.addEventListener("wheel", e => {
  e.preventDefault();
  scrollStep(e.deltaY > 0 ? 1 : -1, subFilter, subFilter.children);
});

// ─── Subsystem Filter Click ───────────────────────────────────
subFilter.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".year-item");
    const val  = item.dataset.subsystem;

    // Update description block
    if (descBox) {
      const tagEl  = descBox.querySelector(".desc-tag");
      const textEl = descBox.querySelector(".desc-text");
      const desc   = item.dataset.desc || "Members of Ashwa Racing.";
      const label  = val === "All" ? "All Subsystems" : val.toUpperCase();

      descBox.style.opacity = "0";
      setTimeout(() => {
        if (tagEl)  tagEl.textContent  = label;
        if (textEl) textEl.textContent = desc;
        descBox.style.opacity = "1";
      }, 150);
    }

    subFilter.querySelectorAll(".filter-btn").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    activeSubsystem = val;
    renderMembers(activeYear, activeSubsystem);
  });
});

// ─── Back to Top ──────────────────────────────────────────────
const backToTopBtn = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  backToTopBtn.style.display = window.scrollY > 400 ? "flex" : "none";
});

backToTopBtn.addEventListener("click", () => {
  const anchor = document.getElementById("filters-start");
  (anchor || document.documentElement).scrollIntoView({ behavior: "smooth" });
});

// ─── Init ─────────────────────────────────────────────────────
window.addEventListener("load", () => {

  // Build year filter dynamically from teamData (newest to oldest)
  const years   = [...new Set(teamData.map(m => m.year))].sort((a, b) => Number(b) - Number(a));
  const spacers = yearFilter.querySelectorAll(".spacer");

  years.forEach(year => {
    const item          = document.createElement("div");
    item.className      = "year-item";
    item.dataset.year   = year;

    const btn           = document.createElement("button");
    btn.className       = "filter-btn";
    btn.textContent     = year;

    btn.addEventListener("click", () => {
      yearFilter.querySelectorAll(".filter-btn").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      activeYear = year;
      renderMembers(activeYear, activeSubsystem);
    });

    item.appendChild(btn);
    yearFilter.insertBefore(item, spacers[spacers.length - 1]);
  });

  // Activate the first available year
  const firstYearItem = [...yearFilter.children].find(el => el.dataset.year);
  if (firstYearItem) {
    activeYear = firstYearItem.dataset.year;
    firstYearItem.querySelector(".filter-btn").classList.add("active");
  }

  renderMembers(activeYear, activeSubsystem);

  // Centre the active filter items on load
  setTimeout(() => {
    if (firstYearItem) {
      yearFilter.scrollLeft =
        firstYearItem.offsetLeft - yearFilter.clientWidth / 2 + firstYearItem.clientWidth / 2;
    }
    const firstSubItem = [...subFilter.children].find(el => el.dataset.subsystem);
    if (firstSubItem) {
      subFilter.scrollLeft =
        firstSubItem.offsetLeft - subFilter.clientWidth / 2 + firstSubItem.clientWidth / 2;
    }
  }, 100);
});