// This file contains utility functions for generating mock data
// It's not used in the application but provided for reference

export const generateMockContacts = (count: number = 50) => {
  const firstNames = ["John", "Sarah", "Mike", "Lisa", "David", "Emma", "Chris", "Anna", "Tom", "Julia"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson"];
  const companies = ["TechStart Solutions", "Digital Innovations Inc", "Global Enterprise Corp", "Smart Systems Ltd", "Future Tech Co"];
  const positions = ["CEO", "CTO", "Sales Manager", "Marketing Director", "VP Sales", "Product Manager"];
  const sources = ["Website", "Referral", "Cold Call", "Trade Show", "Social Media", "Email Campaign"];

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    email: `contact${index + 1}@example.com`,
    phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    company: companies[Math.floor(Math.random() * companies.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    leadScore: Math.floor(Math.random() * 100),
    leadStatus: ["new", "warm", "hot", "cold"][Math.floor(Math.random() * 4)],
    source: sources[Math.floor(Math.random() * sources.length)],
    notes: "Auto-generated contact for testing purposes",
    lastContactDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
  }));
};

export const generateMockActivities = (contactIds: number[], count: number = 100) => {
  const activities = ["call", "email", "meeting", "note"];
  const titles = [
    "Initial contact call",
    "Follow-up email sent",
    "Product demo scheduled",
    "Contract discussion",
    "Pricing proposal sent",
    "Meeting notes added"
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    contactId: contactIds[Math.floor(Math.random() * contactIds.length)],
    type: activities[Math.floor(Math.random() * activities.length)],
    title: titles[Math.floor(Math.random() * titles.length)],
    description: "Auto-generated activity for testing purposes",
    date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
  }));
};
