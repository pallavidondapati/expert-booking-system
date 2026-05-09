require('dotenv').config();
const mongoose = require('mongoose');
const Expert = require('../models/Expert');
const connectDB = require('./db');

const experts = [
  {
    name: 'Dr. Ananya Krishnan',
    category: 'Technology',
    specialization: 'Artificial Intelligence & Machine Learning',
    experience: 12,
    rating: 4.9,
    reviewCount: 342,
    bio: 'Former Google AI researcher with 12 years of experience in deep learning and NLP. Has led AI initiatives at Fortune 500 companies.',
    avatar: 'AK',
    hourlyRate: 250,
    availableSlots: generateSlots(),
  },
  {
    name: 'Rajiv Mehta',
    category: 'Finance',
    specialization: 'Investment Banking & Portfolio Management',
    experience: 15,
    rating: 4.8,
    reviewCount: 218,
    bio: 'CFA with 15 years at Goldman Sachs. Expert in equity markets, derivatives, and portfolio optimization strategies.',
    avatar: 'RM',
    hourlyRate: 300,
    availableSlots: generateSlots(),
  },
  {
    name: 'Dr. Priya Sharma',
    category: 'Healthcare',
    specialization: 'Cardiological Research & Clinical Trials',
    experience: 18,
    rating: 4.95,
    reviewCount: 189,
    bio: 'AIIMS alumna, published cardiologist with 18 years of clinical and research experience. Specializes in preventive cardiology.',
    avatar: 'PS',
    hourlyRate: 400,
    availableSlots: generateSlots(),
  },
  {
    name: 'Vikram Nair',
    category: 'Legal',
    specialization: 'Corporate Law & M&A',
    experience: 10,
    rating: 4.7,
    reviewCount: 156,
    bio: 'Senior partner at a top-tier law firm specializing in mergers, acquisitions, and corporate governance for tech startups.',
    avatar: 'VN',
    hourlyRate: 350,
    availableSlots: generateSlots(),
  },
  {
    name: 'Meera Iyer',
    category: 'Marketing',
    specialization: 'Digital Marketing & Growth Hacking',
    experience: 8,
    rating: 4.85,
    reviewCount: 274,
    bio: 'Growth lead who scaled 3 startups to Series B. Expert in performance marketing, SEO, and conversion rate optimization.',
    avatar: 'MI',
    hourlyRate: 180,
    availableSlots: generateSlots(),
  },
  {
    name: 'Dr. Suresh Patel',
    category: 'Technology',
    specialization: 'Cloud Architecture & DevOps',
    experience: 14,
    rating: 4.75,
    reviewCount: 198,
    bio: 'AWS/GCP certified architect with 14 years building scalable infrastructure. Led cloud migrations for enterprises handling millions of users.',
    avatar: 'SP',
    hourlyRate: 220,
    availableSlots: generateSlots(),
  },
  {
    name: 'Kavitha Reddy',
    category: 'Design',
    specialization: 'UX/UI Design & Design Systems',
    experience: 9,
    rating: 4.88,
    reviewCount: 312,
    bio: 'Design lead at a top product studio. Created design systems used by over 50 products. Speaker at DesignConf and UXIndia.',
    avatar: 'KR',
    hourlyRate: 200,
    availableSlots: generateSlots(),
  },
  {
    name: 'Arjun Bose',
    category: 'Entrepreneurship',
    specialization: 'Startup Strategy & Fundraising',
    experience: 11,
    rating: 4.92,
    reviewCount: 145,
    bio: 'Founded and exited 2 startups (one acquired by Zomato). Angel investor and mentor who has helped 40+ startups raise funding.',
    avatar: 'AB',
    hourlyRate: 500,
    availableSlots: generateSlots(),
  },
];

function generateSlots() {
  const slots = [];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    // Skip Sundays
    if (date.getDay() === 0) continue;

    const dateStr = date.toISOString().split('T')[0];
    times.forEach((time) => {
      slots.push({
        date: dateStr,
        time,
        isBooked: false,
      });
    });
  }
  return slots;
}

async function seed() {
  try {
    await connectDB();
    await Expert.deleteMany({});
    const created = await Expert.insertMany(experts);
    console.log(`✅ Seeded ${created.length} experts`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
