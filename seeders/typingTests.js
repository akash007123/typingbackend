const mongoose = require('mongoose');
const TypingTest = require('../models/TypingTest');
require('dotenv').config();

const sampleTests = [
  {
    title: "The Quick Brown Fox",
    content: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. It is commonly used for typing practice and font testing. The sentence has been used since the late 1800s and remains popular today for its brevity and completeness.",
    difficulty: "easy",
    category: "general",
    duration: 60,
    tags: ["pangram", "alphabet", "classic"]
  },
  {
    title: "Programming Fundamentals",
    content: "function calculateSum(array) { let sum = 0; for (let i = 0; i < array.length; i++) { sum += array[i]; } return sum; } const numbers = [1, 2, 3, 4, 5]; const result = calculateSum(numbers); console.log('The sum is:', result);",
    difficulty: "hard",
    category: "programming",
    duration: 90,
    tags: ["javascript", "function", "array", "loop"]
  },
  {
    title: "Business Communication",
    content: "Dear valued customer, we are pleased to inform you that your recent order has been processed successfully. Our team is committed to providing excellent service and ensuring your satisfaction. Please feel free to contact our customer support team if you have any questions or concerns regarding your purchase.",
    difficulty: "medium",
    category: "business",
    duration: 75,
    tags: ["email", "customer service", "professional"]
  },
  {
    title: "Scientific Method",
    content: "The scientific method is a systematic approach to understanding the natural world. It involves making observations, forming hypotheses, conducting experiments, analyzing data, and drawing conclusions. This process helps scientists build reliable knowledge about how the universe works and allows for peer review and replication of results.",
    difficulty: "medium",
    category: "science",
    duration: 80,
    tags: ["research", "hypothesis", "experiment", "analysis"]
  },
  {
    title: "Shakespeare Quote",
    content: "To be or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles and, by opposing, end them. To die—to sleep, no more; and by a sleep to say we end the heart-ache and the thousand natural shocks that flesh is heir to.",
    difficulty: "hard",
    category: "literature",
    duration: 120,
    tags: ["shakespeare", "hamlet", "classic", "poetry"]
  },
  {
    title: "Daily Routine",
    content: "Every morning I wake up at seven o'clock and start my day with a cup of coffee. After breakfast, I check my emails and plan my tasks for the day. I believe that having a structured routine helps maintain productivity and reduces stress throughout the busy workday.",
    difficulty: "easy",
    category: "general",
    duration: 45,
    tags: ["routine", "morning", "productivity", "lifestyle"]
  },
  {
    title: "Web Development Basics",
    content: "HTML provides the structure of web pages, CSS handles the styling and layout, and JavaScript adds interactivity and dynamic behavior. Modern web development also involves frameworks like React, Vue, and Angular, which help developers create complex user interfaces more efficiently.",
    difficulty: "medium",
    category: "programming",
    duration: 60,
    tags: ["html", "css", "javascript", "frameworks", "web"]
  },
  {
    title: "Environmental Conservation",
    content: "Climate change is one of the most pressing issues of our time. Reducing carbon emissions, protecting biodiversity, and promoting sustainable practices are essential for preserving our planet for future generations. Individual actions, combined with policy changes and technological innovations, can make a significant difference.",
    difficulty: "medium",
    category: "science",
    duration: 70,
    tags: ["environment", "climate", "sustainability", "conservation"]
  },
  {
    title: "Fast Typing Challenge",
    content: "Pack my box with five dozen liquor jugs. How quickly daft jumping zebras vex. Quick zephyrs blow, vexing daft Jim. Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly.",
    difficulty: "hard",
    category: "general",
    duration: 30,
    tags: ["speed", "challenge", "pangrams", "quick"]
  },
  {
    title: "Meeting Minutes Template",
    content: "Meeting Date: Today's date. Attendees: List of participants. Agenda Items: 1. Review of previous action items 2. Project status updates 3. Budget discussion 4. Next steps and assignments. Action Items: Specific tasks assigned to team members with deadlines. Next Meeting: Scheduled for next week.",
    difficulty: "easy",
    category: "business",
    duration: 60,
    tags: ["meeting", "template", "organization", "workplace"]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/typing-test');
    console.log('Connected to MongoDB');

    // Clear existing tests (optional)
    await TypingTest.deleteMany({});
    console.log('Cleared existing typing tests');

    // Insert sample tests
    const insertedTests = await TypingTest.insertMany(sampleTests);
    console.log(`Inserted ${insertedTests.length} typing tests`);

    // Display summary
    console.log('\nSample tests created:');
    insertedTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.title} (${test.difficulty}, ${test.duration}s)`);
    });

    console.log('\nDatabase seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = { sampleTests, seedDatabase };
