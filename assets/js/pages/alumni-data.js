/* ============================================================
   ASHWA RACING — alumni-data.js
   ──────────────────────────────────────────────────────────
   THIS IS THE ONLY FILE YOU NEED TO EDIT.
   
   ORG_STRUCTURE — the org chart tree.
   Add members[] to any node that should show member chips.
   Leave members[] empty (or omit) for nodes that are header-only.
   
   ALUMNI — notable alumni cards + testimonials.
   ============================================================ */

// ─── Org chart ────────────────────────────────────────────────
// node fields:
//   id        — unique string (no spaces)
//   label     — display text
//   sublabel  — optional small text below label
//   type      — "root" | "mgmt" | "programme" | "subsystem" | "leaf"
//   members   — array of { name, photo? } — omit or [] = no member list
//   children  — nested nodes

const ORG_STRUCTURE = {
  id: "root",
  label: "Ashwa Racing",
  sublabel: "Steering Committee",
  type: "root",
  members: [],          // steering committee — no member chips (header only)
  sideLeft: [
    {
      id: "advisors",
      label: "Advisors",
      type: "leaf",
      members: [
        {
          name:"Arunraj Subbaraj (Founder)",
          designation:"Director, Quality HDPE Packaging Industry",
          photo:"https://assets.ashwaracing.org/images/alumni-management/advisor/arunraj.webp"
        }
      ]       // no member list per spec
    },
    {
      id: "alumni-node",
      label: "Alumni",
      type: "leaf",
      members: [
        {
          name:"Bhuvan Doreswamy (Electrical Advisor)",
          designation:"Student, Masters of ECE, University of Minnesota. Former PD at Microchip",
          photo:"https://assets.ashwaracing.org/images/team/default.webp"
        },
        {
          name:"Darren Nishan Patrao (Mechanical Advisor)",
          designation:"Mechanical Engineer, Applied Materials.",
          photo:"https://assets.ashwaracing.org/images/team/default.webp"
        },
        {
          name:"Goutham SG (Advisor)",
          designation:"Designation",
          photo:"https://assets.ashwaracing.org/images/team/default.webp"
        }
      ]       // no member list per spec
    },
    {
      id: "industry",
      label: "Industry Leaders",
      type: "leaf",
      members: [
        {
          name:"Hubert Reilard",
          designation:"Managing Partner, COMANO Advisory LLP. Former Managing Director, EFD Induction Group",
          photo:"https://assets.ashwaracing.org/images/alumni-management/industryleads/herbert.webp"
        },
        {
          name:"Harish Kukreja",
          designation:"CEO at Aquarius Estates & Properties",
          photo:"https://assets.ashwaracing.org/images/team/default.webp"
        },
      ]       // no member list per spec
    }
  ],
  sideRight: [
    {
      id: "rsst",
      label: "RSST Management",
      type: "leaf",
      members: [
        {
          name: "Dr. M.P. Shyam",
          designation: "President, RSST",
          photo: "https://assets.ashwaracing.org/images/alumni-management/RSST/mpshyam.webp"
        },
        {
          name: "Dr. C. Vinod Hayagriv",
          designation: "Vice President, RSST",
          photo: "https://assets.ashwaracing.org/images/alumni-management/RSST/cvinod.webp"
        },
        {
          name: "Mr. A.C. Chandrashekar Raju",
          designation: "Vice President, RSST",
          photo: "https://assets.ashwaracing.org/images/alumni-management/RSST/acchandrashekar.webp"
        },
        {
          name: "Mr. P.S. Venkatesh Babu",
          designation: "Treasurer, RSST",
          photo: "https://assets.ashwaracing.org/images/alumni-management/RSST/psvenkatesh.webp"
        },
        {
          name: "Dr. (h.c.) A.V.S. Murthy",
          designation: "Honorary Secretary, RSST",
          photo: "https://assets.ashwaracing.org/images/alumni-management/RSST/avsmurthy.webp"
        },
        {
          name: "Mr. D.P. Nagaraj",
          designation: "Honorary Joint Secretary, RSST",
          photo: "https://assets.ashwaracing.org/images/alumni-management/RSST/dpnagaraj.webp"
        },
        {
          name: "Mr. Nikhil A Murthy",
          designation: "Assistant Secretary, RSST",
          photo: "https://assets.ashwaracing.org/images/alumni-management/RSST/nikhilamurthy.webp"
        }
      ]
    },
    {
      id: "rvce",
      label: "RVCE Management",
      type: "leaf",
      members: [
        { 
          name: "Dr. K.N. Subramanya",
          designation:"Principal, R.V. College of Engineering",
          photo: "https://assets.ashwaracing.org/images/alumni-management/RVCE/knsubramanya.webp" 
        },
        {
          name: "Dr. Ranvindra S. Kulkarni (Faculty Advisor)",
          designation:"Professor, Department of Aerospace Engineering, R.V. College of Engineering",
          photo: "https://assets.ashwaracing.org/images/alumni-management/RVCE/ravindraskulkarni.webp" 
        },
      ]
    }
  ],
  children: [
    // ── Combustion (left) ──
    {
      id: "cv",
      label: "Combustion",
      type: "programme",
      members: [],
      children: [
        {
          id: "cv-leads",
          label: "Team Leaders",
          type: "subsystem",
          members: [
            { name: "Shravan CS (Team Captain)", photo: "https://assets.ashwaracing.org/images/team/members/2027/Shravan CS.webp" },
            { name: "N Akshay Urs (Project Manager)", photo: "https://assets.ashwaracing.org/images/team/members/2027/N Akshay Urs.webp" },
            { name: "Sathvik S Naik (Chief Engineer)", photo: "https://assets.ashwaracing.org/images/team/members/2027/Sathvik S Naik.webp" },
          ],
          children: []
        }
      ]
    },

    // ── Centre column ──
    {
      id: "centre",
      label: "",          // invisible grouping node
      type: "centre-col",
      members: [],
      children: [
        {
          id: "design",
          label: "Design Phase",
          type: "mgmt",
          members: []     // no members per spec
        },
        {
          id: "validation",
          label: "Validation Phase",
          type: "mgmt",
          members: []     // no members per spec
        },
        {
          id: "manufacturing",
          label: "Manufacturing Phase",
          type: "mgmt",
          members: []     // no members per spec
        },
        {
          id: "testing",
          label: "Testing Phase",
          type: "mgmt",
          members: []     // no members per spec
        }
      ]
    },

    // ── Hybrid (right) ──
    // {
    //   id: "hyb",
    //   label: "Hybrid",
    //   type: "programme",
    //   members: [],
    //   children: [
    //     {
    //       id: "hyb-leads",
    //       label: "Team Leaders",
    //       type: "subsystem",
    //       members: [
    //         { name: "Team Captain", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
    //         { name: "Project Manager", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
    //         { name: "Chief Engineer", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
    //       ],
    //       children: []
    //     }
    //     // "Team" node removed per spec — only team leaders shown
    //   ]
    // },
    {
      id: "ev",
      label: "Electric",
      type: "programme",
      members: [],
      children: [
        {
          id: "ev-leads",
          label: "Team Leaders",
          type: "subsystem",
          members: [
            { name: "Amitha A V (Team Captain)", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
            { name: "Kritik Modawel (Project Manager)", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
            { name: "Gaurav Raju (Chief Engineer)", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
          ],
          children: []
        }
        // "Team" node removed per spec — only team leaders shown
      ]
    },
    // {
    //   id: "dv",
    //   label: "Driverless",
    //   type: "programme",
    //   members: [],
    //   children: [
    //     {
    //       id: "dv-leads",   // IMPORTANT: unique id
    //       label: "Team Leaders",
    //       type: "subsystem",
    //       members: [
    //         { name: "Team Captain", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
    //         { name: "Project Manager", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
    //         { name: "Chief Engineer", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
    //       ],
    //       children: []
    //     }
    //   ]
    // },
    // {
    //   id: "hyperloop",
    //   label: "Hyperloop",
    //   type: "programme",
    //   members: [],
    //   children: [
    //     {
    //       id: "hyperloop-leads",  // unique id
    //       label: "Team Leaders",
    //       type: "subsystem",
    //       members: [
    //         { name: "Team Captain", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
    //         { name: "Project Manager", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
    //         { name: "Chief Engineer", photo: "https://assets.ashwaracing.org/images/team/default.webp" },
    //       ],
    //       children: []
    //     }
    //   ]
    // }
  ],

  // ── Bottom subsystem columns ──
  subsystems: {
    left: [
    ],
    right: [
      {
        id: "aero",
        label: "Aero",
        type: "subsystem",
        members: []       // no members per spec
      },
      {
        id: "brakes",
        label: "Brakes & Logistics",
        type: "subsystem",
        members: []       // no members per spec
      },
      {
        id: "chassis",
        label: "Chassis & Workshop Management",
        type: "subsystem",
        members: []       // no members per spec
      },
      {
        id: "drivetrain",
        label: "Drivetrain & Human Resources",
        type: "subsystem",
        members: []       // no members per spec
      },
      {
        id: "electrical",
        label: "Electrical & Testing",
        type: "subsystem",
        members: []       // no members per spec
      },
      {
        id: "engine",
        label: "Engine",
        type: "subsystem",
        members: []       // no members per spec
      },
      {
        id: "steering_finance",
        label: "Steering & Finance",
        type: "subsystem",
        members: []       // no members per spec
      },
      {
        id: "it",
        label: "IT",
        type: "subsystem",
        members: []       // no members per spec
      },
      {
        id: "smp",
        label: "Sponsorship, Marketing & Public Relations",
        type: "subsystem",
        members: []       // no members per spec
      },
      {
        id: "suspension",
        label: "Suspension & Admin",
        type: "subsystem",
        members: []       // no members per spec
      },
    ]
  }
};

// ─── Notable alumni cards ─────────────────────────────────────
const ALUMNI = [
  {
    name: "Ravikiran K",
    role: "Team Captain",
    batch: "2025",
    photo: "https://assets.ashwaracing.org/images/team/members/2025/Ravikiran K.webp",
    company: "",
    position: "MBA",
    linkedin: null,
    programme: "cv",
    testimony: "My journey at Ashwa Racing was the most transformative experience of my life. I learnt volumes about team building, project management, leadership and so on while simultaneously discovering my own shortcomings and strengths. These experiences not only added to my knowledge base but also created lifelong memories which I will carry forward into through every walk of life. I have had the enormous privilege of leading an amazingly talented team of individuals and the journey has only fueled my drive to one day achieve the success I aspire towards.",
  },
  {
    name: "Chinmay Vanahalli",
    role: "Chief Engineer",
    batch: "2025",
    photo: "https://assets.ashwaracing.org/images/team/members/2025/Chinmay Vanahalli.webp",
    company: "Ather Energy",
    position: "Product Engineer",
    linkedin: "https://www.linkedin.com/in/chinmay-v-ab703620b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    programme: "cv",
    testimony: "My journey in Ashwa is something I will cherish forever. From the late-night manufacturing and testing sessions to the chaos of assembly or inventory session, the experience transformed me into a much better engineer. Being part of this team taught me to push my limits, thrive in a fast-paced environment, and truly understand my own strengths and weaknesses. Most importantly, Ashwa connected me with like-minded, hardworking individuals who are driven to achieve a common goal.",
  },
];
