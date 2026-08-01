// --------------------------------------------------
// Secureframe-compatible fallback data
// --------------------------------------------------

const iso42001Controls = [
  {
    id: 1,
    frameworkId: 1,
    requirementNumber: "4.1",
    control: "Organizational Context for AI",
    question: "Has the organization identified the internal and external factors that affect its AI management system?",
    category: "Organizational Context",
    owner: "Compliance Manager",
    status: "Passed",
    evidenceUrl: "",
    comments: "AI-related business, regulatory, and technology factors are documented.",
    description: "Establishes the context and boundaries of the AI management system.",
    lastReviewed: "2026-07-19T09:10:00+03:00",
  },
  {
    id: 2,
    frameworkId: 1,
    requirementNumber: "5.2",
    control: "AI Policy",
    question: "Is an AI policy established, approved, communicated, and reviewed?",
    category: "Leadership",
    owner: "Compliance Manager",
    status: "Passed",
    evidenceUrl: "",
    comments: "The AI governance policy is approved and published internally.",
    description: "Defines management direction and commitments for responsible AI.",
    lastReviewed: "2026-07-18T13:20:00+03:00",
  },
  {
    id: 3,
    frameworkId: 1,
    requirementNumber: "5.3",
    control: "AI Roles and Responsibilities",
    question: "Are responsibilities and authorities for the AI management system assigned and communicated?",
    category: "Leadership",
    owner: "Information Security Team",
    status: "Passed",
    evidenceUrl: "",
    comments: "AI governance responsibilities are included in the operating model.",
    description: "Ensures accountability for AI governance activities.",
    lastReviewed: "2026-07-18T15:30:00+03:00",
  },
  {
    id: 4,
    frameworkId: 1,
    requirementNumber: "6.1",
    control: "AI Risk Assessment",
    question: "Are AI risks and opportunities identified, assessed, treated, and monitored?",
    category: "Planning",
    owner: "Information Security Team",
    status: "In Progress",
    evidenceUrl: "",
    comments: "The risk methodology is approved; remaining AI use cases are being assessed.",
    description: "Applies a repeatable risk-management process to AI systems.",
    lastReviewed: "2026-07-19T08:40:00+03:00",
  },
  {
    id: 5,
    frameworkId: 1,
    requirementNumber: "6.2",
    control: "AI Objectives",
    question: "Are measurable AI management objectives defined, monitored, and updated?",
    category: "Planning",
    owner: "Compliance Manager",
    status: "Passed",
    evidenceUrl: "",
    comments: "Objectives cover risk, transparency, monitoring, and accountability.",
    description: "Connects AI governance goals to measurable outcomes.",
    lastReviewed: "2026-07-17T11:15:00+03:00",
  },
  {
    id: 6,
    frameworkId: 1,
    requirementNumber: "7.2",
    control: "AI Competence",
    question: "Are personnel involved with AI systems competent based on education, training, or experience?",
    category: "Support",
    owner: "Compliance Manager",
    status: "In Progress",
    evidenceUrl: "",
    comments: "Role-specific responsible-AI training is being rolled out.",
    description: "Ensures people performing AI-related work have appropriate competence.",
    lastReviewed: "2026-07-16T14:05:00+03:00",
  },
  {
    id: 7,
    frameworkId: 1,
    requirementNumber: "7.5",
    control: "AI Documented Information",
    question: "Is documented information required by the AI management system controlled and maintained?",
    category: "Support",
    owner: "Compliance Manager",
    status: "Passed",
    evidenceUrl: "",
    comments: "Policies, risk records, model cards, and approvals are version controlled.",
    description: "Maintains reliable and traceable AI governance records.",
    lastReviewed: "2026-07-18T10:25:00+03:00",
  },
  {
    id: 8,
    frameworkId: 1,
    requirementNumber: "8.2",
    control: "AI Risk Treatment",
    question: "Are controls selected and implemented to treat identified AI risks?",
    category: "Operation",
    owner: "Engineering Team",
    status: "In Progress",
    evidenceUrl: "",
    comments: "Technical and procedural safeguards are being mapped to high-risk use cases.",
    description: "Implements treatment measures proportional to assessed AI risks.",
    lastReviewed: "2026-07-19T10:00:00+03:00",
  },
  {
    id: 9,
    frameworkId: 1,
    requirementNumber: "8.4",
    control: "AI System Impact Assessment",
    question: "Are impact assessments performed for AI systems that may affect individuals or society?",
    category: "Operation",
    owner: "Compliance Manager",
    status: "Failed",
    evidenceUrl: "",
    comments: "Impact assessments are incomplete for two customer-facing AI use cases.",
    description: "Identifies potential effects on individuals, groups, and society.",
    lastReviewed: "2026-07-19T10:40:00+03:00",
  },
  {
    id: 10,
    frameworkId: 1,
    requirementNumber: "9.1",
    control: "AI Performance Monitoring",
    question: "Are AI management performance and control effectiveness monitored and evaluated?",
    category: "Performance Evaluation",
    owner: "Engineering Team",
    status: "Passed",
    evidenceUrl: "",
    comments: "Model and governance metrics are reviewed monthly.",
    description: "Provides evidence that the AI management system is operating effectively.",
    lastReviewed: "2026-07-18T16:00:00+03:00",
  },
  {
    id: 11,
    frameworkId: 1,
    requirementNumber: "9.2",
    control: "AI Internal Audit",
    question: "Are internal audits of the AI management system planned and performed?",
    category: "Performance Evaluation",
    owner: "Internal Audit Viewer",
    status: "Not Started",
    evidenceUrl: "",
    comments: "The first formal AI management system audit is scheduled for Q4.",
    description: "Provides independent assurance over the AI management system.",
    lastReviewed: "2026-07-15T12:10:00+03:00",
  },
  {
    id: 12,
    frameworkId: 1,
    requirementNumber: "10.1",
    control: "AI Continual Improvement",
    question: "Are nonconformities corrected and the AI management system continually improved?",
    category: "Improvement",
    owner: "Compliance Manager",
    status: "Passed",
    evidenceUrl: "",
    comments: "Corrective actions are tracked through the compliance review process.",
    description: "Ensures governance weaknesses result in corrective and preventive action.",
    lastReviewed: "2026-07-18T09:50:00+03:00",
  },
];

const iso27001Controls = [
  {
    id: 13,
    frameworkId: 2,
    requirementNumber: "A.5.1",
    control: "Information Security Policies",
    question:
      "Are information security policies defined, approved, and communicated?",
    category: "Organizational Controls",
    owner: "Compliance",
    status: "Passed",
    evidenceUrl: "",
    comments:
      "The policy framework is approved and available to all employees.",
    description:
      "Establishes management direction for information security.",
    lastReviewed: "2026-07-18T08:30:00+03:00",
  },
  {
    id: 14,
    frameworkId: 2,
    requirementNumber: "A.5.9",
    control: "Asset Inventory",
    question:
      "Is an accurate inventory maintained for information and technology assets?",
    category: "Asset Management",
    owner: "IT Asset Management",
    status: "Passed",
    evidenceUrl: "",
    comments:
      "The inventory includes ownership, location, classification, and lifecycle status.",
    description:
      "Supports accountability and protection of organizational assets.",
    lastReviewed: "2026-07-17T14:15:00+03:00",
  },
  {
    id: 15,
    frameworkId: 2,
    requirementNumber: "A.5.15",
    control: "Access Control Policy",
    question:
      "Are access control requirements documented and consistently enforced?",
    category: "Access Control",
    owner: "Identity and Access Management",
    status: "Passed",
    evidenceUrl: "",
    comments:
      "Role-based access requirements are documented for critical applications.",
    description:
      "Ensures access is granted according to business and security requirements.",
    lastReviewed: "2026-07-18T12:45:00+03:00",
  },
  {
    id: 16,
    frameworkId: 2,
    requirementNumber: "A.5.19",
    control: "Supplier Security Review",
    question:
      "Are supplier security risks assessed before services are approved?",
    category: "Supplier Relationships",
    owner: "Vendor Management",
    status: "Passed",
    evidenceUrl: "",
    comments:
      "Supplier due diligence is completed before contract approval.",
    description:
      "Reduces risks associated with suppliers and outsourced services.",
    lastReviewed: "2026-07-15T09:10:00+03:00",
  },
  {
    id: 17,
    frameworkId: 2,
    requirementNumber: "A.5.24",
    control: "Incident Response Planning",
    question:
      "Are security incident responsibilities and response procedures documented?",
    category: "Incident Management",
    owner: "Security Operations",
    status: "Passed",
    evidenceUrl: "",
    comments:
      "The incident response plan includes escalation and communication procedures.",
    description:
      "Prepares the organization to manage information security incidents.",
    lastReviewed: "2026-07-19T09:00:00+03:00",
  },
  {
    id: 18,
    frameworkId: 2,
    requirementNumber: "A.5.29",
    control: "Business Continuity Security",
    question:
      "Is information security maintained during disruptions and recovery activities?",
    category: "Business Continuity",
    owner: "Business Continuity",
    status: "Passed",
    evidenceUrl: "",
    comments:
      "Security requirements are included in recovery and continuity procedures.",
    description:
      "Maintains appropriate security controls during business disruption.",
    lastReviewed: "2026-07-16T13:20:00+03:00",
  },
  {
    id: 19,
    frameworkId: 2,
    requirementNumber: "A.6.3",
    control: "Security Awareness Training",
    question:
      "Do employees complete information security awareness training?",
    category: "People Controls",
    owner: "Human Resources",
    status: "Passed",
    evidenceUrl: "",
    comments:
      "Annual training completion is above the internal target.",
    description:
      "Ensures personnel understand their information security responsibilities.",
    lastReviewed: "2026-07-17T10:10:00+03:00",
  },
  {
    id: 20,
    frameworkId: 2,
    requirementNumber: "A.7.1",
    control: "Physical Security Perimeters",
    question:
      "Are sensitive facilities protected by appropriate physical security controls?",
    category: "Physical Controls",
    owner: "Facilities",
    status: "Passed",
    evidenceUrl: "",
    comments:
      "Restricted areas require badge access and are monitored by CCTV.",
    description:
      "Prevents unauthorized physical access to sensitive facilities.",
    lastReviewed: "2026-07-14T11:35:00+03:00",
  },
  {
    id: 21,
    frameworkId: 2,
    requirementNumber: "A.8.8",
    control: "Vulnerability Management",
    question:
      "Are technical vulnerabilities identified, prioritized, and remediated?",
    category: "Technology Controls",
    owner: "Infrastructure Security",
    status: "Passed",
    evidenceUrl: "",
    comments:
      "Critical vulnerabilities are tracked against defined remediation timelines.",
    description:
      "Reduces exposure caused by known technical vulnerabilities.",
    lastReviewed: "2026-07-19T07:30:00+03:00",
  },
  {
    id: 22,
    frameworkId: 2,
    requirementNumber: "A.8.9",
    control: "Configuration Management",
    question:
      "Are secure configuration standards applied to technology assets?",
    category: "Technology Controls",
    owner: "IT Operations",
    status: "In Progress",
    evidenceUrl: "",
    comments:
      "Server standards are complete; endpoint baseline deployment is ongoing.",
    description:
      "Ensures systems use approved and consistently maintained configurations.",
    lastReviewed: "2026-07-19T08:50:00+03:00",
  },
  {
    id: 23,
    frameworkId: 2,
    requirementNumber: "A.8.13",
    control: "Backup Restoration Testing",
    question:
      "Are backup restoration procedures tested at planned intervals?",
    category: "Operations Security",
    owner: "IT Operations",
    status: "Failed",
    evidenceUrl: "",
    comments:
      "The most recent restoration test exceeded the approved recovery objective.",
    description:
      "Confirms that backed-up information can be restored when required.",
    lastReviewed: "2026-07-18T15:40:00+03:00",
  },
  {
    id: 24,
    frameworkId: 2,
    requirementNumber: "A.8.16",
    control: "Monitoring Activities",
    question:
      "Are systems and networks monitored for abnormal or suspicious activity?",
    category: "Monitoring",
    owner: "Security Operations",
    status: "Failed",
    evidenceUrl: "",
    comments:
      "Several non-critical systems are not yet connected to central monitoring.",
    description:
      "Enables timely detection and investigation of security events.",
    lastReviewed: "2026-07-19T09:45:00+03:00",
  },
];

export const controls = [
  ...iso42001Controls,
  ...iso27001Controls,
];

function calculateFrameworkMetrics(frameworkId) {
  const frameworkControls = controls.filter(
    (control) => control.frameworkId === frameworkId
  );

  const total = frameworkControls.length;
  const count = (status) =>
    frameworkControls.filter(
      (control) => control.status === status
    ).length;

  const passed = count("Passed");
  const failed = count("Failed");
  const inProgress = count("In Progress");
  const notStarted = count("Not Started");

  return {
    compliance:
      total > 0
        ? Math.round((passed / total) * 100)
        : 0,
    passed,
    failed,
    inProgress,
    notStarted,
    total,
  };
}

function createFramework({
  id,
  name,
  status,
  lastUpdated,
  description,
  owner,
  trend,
}) {
  return {
    id,
    name,
    status,
    ...calculateFrameworkMetrics(id),
    lastUpdated,
    description,
    owner,
    source: "secureframe",
    trend,
  };
}

export const frameworks = [
  createFramework({
    id: 1,
    name: "ISO/IEC 42001",
    status: "Warning",
    lastUpdated: "2026-07-19T10:40:00+03:00",
    description:
      "Artificial intelligence management system requirements for responsible governance, risk management, and continual improvement.",
    owner: "Compliance Manager",
    trend: [
      { month: "Jan", compliance: 42 },
      { month: "Feb", compliance: 50 },
      { month: "Mar", compliance: 50 },
      { month: "Apr", compliance: 58 },
      { month: "May", compliance: 58 },
      { month: "Jun", compliance: 58 },
    ],
  }),
  createFramework({
    id: 2,
    name: "ISO/IEC 27001",
    status: "Warning",
    lastUpdated: "2026-07-19T09:45:00+03:00",
    description:
      "Information security management controls aligned with ISO/IEC 27001.",
    owner: "Information Security Team",
    trend: [
      { month: "Jan", compliance: 58 },
      { month: "Feb", compliance: 58 },
      { month: "Mar", compliance: 67 },
      { month: "Apr", compliance: 67 },
      { month: "May", compliance: 75 },
      { month: "Jun", compliance: 75 },
    ],
  }),
];
