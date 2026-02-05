// ============================================
// CMU STUDENT COMPETENCY PASSPORT - MOCK DATA
// Decoupled Architecture with Weighted XP System
// ============================================

// Owner Mode Constant (Controls Edit Visibility)
// Set to false to simulate public visitor view
export const IS_OWNER = true;

// Tier weights based on Bloom's Taxonomy adaptation
export const TIER_WEIGHTS = {
  1: 1,  // Basic/Exposure (Talks, Seminars)
  2: 3,  // Intermediate/Practice (Workshops, Labs)
  3: 5,  // Advanced/Impact (Hackathons, Competitions)
} as const;

export const TIER_CONFIG = {
  1: { label: "Participation", color: "bg-slate-100 text-slate-600 border-slate-200" },
  2: { label: "Practice", color: "bg-blue-50 text-blue-600 border-blue-200" },
  3: { label: "Implementation", color: "bg-amber-50 text-amber-700 border-amber-200" },
} as const;

// Master Skill Library (Standardized Skills - LinkedIn aligned)
// Skills tagged as is_market_aligned: true (Simulating LinkedIn Taxonomy matching)
export interface MasterSkill {
  id: string;
  name: string;
  category: string;
  source: string;
  is_market_aligned: boolean;
}

export const MASTER_SKILL_LIBRARY: MasterSkill[] = [
  { id: "ms_python", name: "Python", category: "Digital & Tech Literacy", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_react", name: "React", category: "Digital & Tech Literacy", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_javascript", name: "JavaScript", category: "Digital & Tech Literacy", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_machine_learning", name: "Machine Learning", category: "Digital & Tech Literacy", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_data_analysis", name: "Data Analysis", category: "Critical Thinking", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_public_speaking", name: "Public Speaking", category: "Collaboration & Leadership", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_team_leadership", name: "Team Leadership", category: "Collaboration & Leadership", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_project_management", name: "Project Management", category: "Adaptability & Resilience", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_critical_thinking", name: "Critical Thinking", category: "Critical Thinking", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_research", name: "Research Methods", category: "Domain Expertise", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_ui_ux", name: "UI/UX Design", category: "Digital & Tech Literacy", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_agile", name: "Agile Methodology", category: "Adaptability & Resilience", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_communication", name: "Communication", category: "Collaboration & Leadership", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_problem_solving", name: "Problem Solving", category: "Critical Thinking", source: "LinkedIn", is_market_aligned: true },
  { id: "ms_cloud", name: "Cloud Computing", category: "Digital & Tech Literacy", source: "LinkedIn", is_market_aligned: true },
] as const;

// Privacy Settings Interface
export interface PrivacySettings {
  showRadar: boolean;
  showSkills: boolean;
  showTimeline: boolean;
  showTimelineDetails: boolean;
}

// User Profile
export interface UserProfile {
  id: string;
  name: string;
  studentId: string;
  faculty: string;
  avatarUrl?: string;
  username: string; // For public URL
  bio?: string;
  email?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  isPublic: boolean;
  privacySettings: PrivacySettings;
}

export const mockUser: UserProfile = {
  id: "user_001",
  name: "Alex Johnson",
  studentId: "6510012345",
  faculty: "Faculty of Engineering",
  username: "alex-johnson-651",
  bio: "Data Science Student passionate about AI and building impactful products.",
  email: "alex.johnson@cmu.ac.th",
  linkedinUrl: "https://linkedin.com/in/alex-johnson",
  githubUrl: "https://github.com/alexjohnson",
  isPublic: true,
  privacySettings: {
    showRadar: true,
    showSkills: true,
    showTimeline: true,
    showTimelineDetails: true,
  },
};

// Events with Tier Levels
export interface EventData {
  id: string;
  name: string;
  tierLevel: 1 | 2 | 3;
  date: string;
  skillsAwarded: string[]; // Skill IDs
  totalSessions: number;
  category: string;
}

export const mockEvents: EventData[] = [
  {
    id: "evt_001",
    name: "AI/ML Workshop Series 2025",
    tierLevel: 2,
    date: "2025-01-15",
    skillsAwarded: ["ms_python", "ms_machine_learning", "ms_data_analysis"],
    totalSessions: 5,
    category: "Digital & Tech Literacy",
  },
  {
    id: "evt_002",
    name: "Hackathon: Code for Change",
    tierLevel: 3,
    date: "2025-01-10",
    skillsAwarded: ["ms_react", "ms_team_leadership", "ms_problem_solving"],
    totalSessions: 3,
    category: "Digital & Tech Literacy",
  },
  {
    id: "evt_003",
    name: "Leadership Summit 2025",
    tierLevel: 2,
    date: "2025-01-05",
    skillsAwarded: ["ms_public_speaking", "ms_communication", "ms_team_leadership"],
    totalSessions: 4,
    category: "Collaboration & Leadership",
  },
  {
    id: "evt_004",
    name: "Cloud Computing Bootcamp",
    tierLevel: 2,
    date: "2024-12-20",
    skillsAwarded: ["ms_cloud", "ms_agile"],
    totalSessions: 4,
    category: "Digital & Tech Literacy",
  },
  {
    id: "evt_005",
    name: "Tech Talk: Future of Web3",
    tierLevel: 1,
    date: "2024-12-15",
    skillsAwarded: ["tech_web3"], // Local/Event-specific skill
    totalSessions: 1,
    category: "Digital & Tech Literacy",
  },
  {
    id: "evt_006",
    name: "Research Methodology Workshop",
    tierLevel: 2,
    date: "2024-12-10",
    skillsAwarded: ["ms_research", "ms_critical_thinking"],
    totalSessions: 3,
    category: "Domain Expertise",
  },
  {
    id: "evt_007",
    name: "National Coding Competition",
    tierLevel: 3,
    date: "2024-11-25",
    skillsAwarded: ["ms_python", "ms_javascript", "ms_problem_solving"],
    totalSessions: 2,
    category: "Digital & Tech Literacy",
  },
  {
    id: "evt_008",
    name: "Design Thinking Workshop",
    tierLevel: 2,
    date: "2024-11-15",
    skillsAwarded: ["ms_ui_ux", "ms_problem_solving"],
    totalSessions: 2,
    category: "Critical Thinking",
  },
];

// Attendance Logs
export type AttendanceStatus = "present" | "absent" | "upcoming";

export interface AttendanceLog {
  eventId: string;
  userId: string;
  role: "participant" | "staff";
  sessions: { date: string; status: AttendanceStatus }[];
  certificateEarned: boolean;
  certificateUrl?: string; // Mock URL for certificate download
  proofUrl?: string; // Mock URL for Tier 3 project proof
}

export const mockAttendanceLogs: AttendanceLog[] = [
  {
    eventId: "evt_001",
    userId: "user_001",
    role: "participant",
    sessions: [
      { date: "2025-01-15", status: "present" },
      { date: "2025-01-16", status: "present" },
      { date: "2025-01-17", status: "present" },
      { date: "2025-01-18", status: "present" },
      { date: "2025-01-19", status: "present" },
    ],
    certificateEarned: true,
    certificateUrl: "/certificates/ai-ml-workshop-2025.pdf",
  },
  {
    eventId: "evt_002",
    userId: "user_001",
    role: "staff",
    sessions: [
      { date: "2025-01-10", status: "present" },
      { date: "2025-01-11", status: "present" },
      { date: "2025-01-12", status: "present" },
    ],
    certificateEarned: true,
    proofUrl: "https://github.com/alexjohnson/code-for-change",
  },
  {
    eventId: "evt_003",
    userId: "user_001",
    role: "participant",
    sessions: [
      { date: "2025-01-05", status: "present" },
      { date: "2025-01-06", status: "absent" },
      { date: "2025-01-07", status: "present" },
      { date: "2025-01-08", status: "present" },
    ],
    certificateEarned: true,
    certificateUrl: "/certificates/leadership-summit-2025.pdf",
  },
  {
    eventId: "evt_004",
    userId: "user_001",
    role: "participant",
    sessions: [
      { date: "2024-12-20", status: "present" },
      { date: "2024-12-21", status: "present" },
      { date: "2024-12-22", status: "absent" },
      { date: "2024-12-23", status: "absent" },
    ],
    certificateEarned: false,
  },
  {
    eventId: "evt_005",
    userId: "user_001",
    role: "participant",
    sessions: [{ date: "2024-12-15", status: "present" }],
    certificateEarned: true,
    certificateUrl: "/certificates/web3-tech-talk.pdf",
  },
  {
    eventId: "evt_006",
    userId: "user_001",
    role: "participant",
    sessions: [
      { date: "2024-12-10", status: "present" },
      { date: "2024-12-11", status: "present" },
      { date: "2024-12-12", status: "present" },
    ],
    certificateEarned: true,
    certificateUrl: "/certificates/research-methodology.pdf",
  },
  {
    eventId: "evt_007",
    userId: "user_001",
    role: "participant",
    sessions: [
      { date: "2024-11-25", status: "present" },
      { date: "2024-11-26", status: "present" },
    ],
    certificateEarned: true,
    proofUrl: "https://devpost.com/software/national-coding-2024",
  },
  {
    eventId: "evt_008",
    userId: "user_001",
    role: "participant",
    sessions: [
      { date: "2024-11-15", status: "present" },
      { date: "2024-11-16", status: "present" },
    ],
    certificateEarned: true,
    certificateUrl: "/certificates/design-thinking.pdf",
  },
];

// Skill Transactions (Link User to Skills via Events)
export interface SkillTransaction {
  userId: string;
  skillId: string;
  eventId: string;
  xpEarned: number; // Based on tier weight
  earnedAt: string;
}

// Generate skill transactions from events and attendance
export const generateSkillTransactions = (): SkillTransaction[] => {
  const transactions: SkillTransaction[] = [];

  mockAttendanceLogs.forEach(log => {
    const event = mockEvents.find(e => e.id === log.eventId);
    if (!event) return;

    // Calculate attendance percentage
    const presentCount = log.sessions.filter(s => s.status === "present").length;
    const totalSessions = log.sessions.length;
    const attendanceRate = presentCount / totalSessions;

    // Only award skills if attendance >= 50%
    if (attendanceRate >= 0.5) {
      const tierWeight = TIER_WEIGHTS[event.tierLevel];

      event.skillsAwarded.forEach(skillId => {
        transactions.push({
          userId: log.userId,
          skillId,
          eventId: event.id,
          xpEarned: tierWeight,
          earnedAt: event.date,
        });
      });
    }
  });

  return transactions;
};

// Calculate aggregated skill data for display
export interface AggregatedSkill {
  id: string;
  name: string;
  category: string;
  totalXP: number;
  eventCount: number;
  isMarketAligned: boolean; // Matches global recruitment databases
  isPinned: boolean;
}

export const calculateAggregatedSkills = (): AggregatedSkill[] => {
  const transactions = generateSkillTransactions();
  const skillMap = new Map<string, AggregatedSkill>();

  transactions.forEach(tx => {
    const existing = skillMap.get(tx.skillId);
    const masterSkill = MASTER_SKILL_LIBRARY.find(ms => ms.id === tx.skillId);

    if (existing) {
      existing.totalXP += tx.xpEarned;
      existing.eventCount += 1;
    } else {
      // Determine skill name and category
      let name = tx.skillId;
      let category = "Digital & Tech Literacy";

      if (masterSkill) {
        name = masterSkill.name;
        category = masterSkill.category;
      } else {
        // Local/Event-specific skill
        name = tx.skillId.replace("tech_", "").replace(/_/g, " ");
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }

      skillMap.set(tx.skillId, {
        id: tx.skillId,
        name,
        category,
        totalXP: tx.xpEarned,
        eventCount: 1,
        isMarketAligned: masterSkill?.is_market_aligned || false,
        isPinned: ["ms_python", "ms_react", "ms_machine_learning"].includes(tx.skillId), // Default pins
      });
    }
  });

  return Array.from(skillMap.values()).sort((a, b) => b.totalXP - a.totalXP);
};

// Calculate category scores for radar chart
// Updated dimension names to match WEF/OECD framework
export interface CategoryScore {
  category: string;
  score: number;
  displayScore: number;
}

export const calculateCategoryScores = (): CategoryScore[] => {
  const skills = calculateAggregatedSkills();
  const categoryMap = new Map<string, number>();

  // Updated category names matching WEF/OECD framework
  const categories = [
    "Digital & Tech Literacy",
    "Collaboration & Leadership", 
    "Critical Thinking",
    "Domain Expertise",
    "Adaptability & Resilience"
  ];
  categories.forEach(cat => categoryMap.set(cat, 0));

  skills.forEach(skill => {
    const current = categoryMap.get(skill.category) || 0;
    categoryMap.set(skill.category, current + skill.totalXP);
  });

  return categories.map(cat => {
    const score = categoryMap.get(cat) || 0;
    return {
      category: cat,
      score,
      displayScore: score,
    };
  });
};

// Calculate total XP and stats
export const calculateProfileStats = () => {
  const scores = calculateCategoryScores();
  const totalXP = scores.reduce((sum, s) => sum + s.score, 0);
  const certCount = mockAttendanceLogs.filter(l => l.certificateEarned).length;

  return {
    totalXP,
    totalEvents: mockAttendanceLogs.length,
    certificatesEarned: certCount,
  };
};

// Determine persona based on weighted scores
export interface Persona {
  label: string;
  icon: string;
  color: string;
}

export const determinePersona = (): Persona | null => {
  const scores = calculateCategoryScores();
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);
  const topScore = sortedScores[0];
  const secondScore = sortedScores[1];

  // Check if scores are balanced (difference < 20%)
  if (topScore.score > 0 && secondScore.score > 0) {
    const ratio = secondScore.score / topScore.score;
    if (ratio > 0.8) {
      return {
        label: "Well-Rounded Learner",
        icon: "Sparkles",
        color: "bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-600 border-violet-500/20",
      };
    }
  }

  // Require minimum of 30 weighted points for persona
  if (topScore.score < 30) return null;

  const personas: Record<string, Persona> = {
    Technology: {
      label: "Tech-Savvy Enthusiast",
      icon: "Cpu",
      color: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    },
    Social: {
      label: "Social Connector",
      icon: "Users",
      color: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    },
    Cognitive: {
      label: "Critical Thinker",
      icon: "Brain",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    Domain: {
      label: "Domain Expert",
      icon: "BookOpen",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    "Self-Efficacy": {
      label: "Self-Driven Achiever",
      icon: "Target",
      color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    },
  };

  return personas[topScore.category] || null;
};

// Generate activity timeline data
export interface ActivityItem {
  id: string;
  eventName: string;
  eventDate: string;
  tierLevel: 1 | 2 | 3;
  role: "participant" | "staff";
  sessions: { date: string; status: AttendanceStatus }[];
  attendancePercentage: number;
  certificateEarned: boolean;
  certificateUrl?: string;
  proofUrl?: string;
  category: string;
}

export const generateActivityTimeline = (): ActivityItem[] => {
  return mockAttendanceLogs
    .map((log): ActivityItem | null => {
      const event = mockEvents.find(e => e.id === log.eventId);
      if (!event) return null;

      const presentCount = log.sessions.filter(s => s.status === "present").length;
      const totalSessions = log.sessions.length;

      return {
        id: log.eventId,
        eventName: event.name,
        eventDate: event.date,
        tierLevel: event.tierLevel,
        role: log.role,
        sessions: log.sessions,
        attendancePercentage: Math.round((presentCount / totalSessions) * 100),
        certificateEarned: log.certificateEarned,
        certificateUrl: log.certificateUrl,
        proofUrl: log.proofUrl,
        category: event.category,
      } as ActivityItem;
    })
    .filter((item): item is ActivityItem => item !== null)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
};
