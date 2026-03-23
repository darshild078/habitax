function generateInsight(habitName, yearlyCost, yearlyDays) {
  const name = habitName.toLowerCase();

  // 🎯 Category detection
  let category = "general";

  if (name.includes("coffee") || name.includes("tea")) category = "coffee";
  else if (name.includes("food") || name.includes("takeout") || name.includes("zomato") || name.includes("swiggy")) category = "food";
  else if (name.includes("netflix") || name.includes("subscription") || name.includes("spotify")) category = "subscription";
  else if (name.includes("scroll") || name.includes("instagram") || name.includes("reels")) category = "scroll";
  else if (name.includes("smoke") || name.includes("cigarette") || name.includes("alcohol")) category = "bad";

  // 💸 High Cost (Top Priority)
  if (yearlyCost >= 100000) {
    return "You burned over ₹1 lakh on this 💀";
  }

  if (yearlyCost >= 70000) {
    return "This habit costs more than a premium smartphone 📱";
  }

  if (yearlyCost >= 50000) {
    return "You could take a trip instead ✈️";
  }

  if (yearlyCost >= 20000) {
    return "That’s a month of rent gone 🏠";
  }

  // ⏳ Time-Based Insights
  if (yearlyDays >= 30) {
    return "You lost a whole month of your life 😵";
  }

  if (yearlyDays >= 10) {
    return "You lost more than a week doing this 😳";
  }

  // 🎯 Category-Based Savage Lines

  const savageLines = {
    coffee: [
      "This isn’t coffee. It’s a yearly expense ☕",
      "₹200 today. ₹73,000 before you notice",
      "You’re not buying coffee, you’re buying habit",
      "That daily sip is silently expensive"
    ],
    food: [
      "Your cravings are eating your savings 🍔",
      "You ordered comfort. You got a bill",
      "Late-night hunger, long-term damage",
      "Convenience comes at a cost"
    ],
    subscription: [
      "You don’t watch it. You just pay for it 📺",
      "Auto-renew is silently draining you",
      "You forgot this subscription. Your bank didn’t",
      "You’re subscribed to losing money"
    ],
    scroll: [
      "Endless scroll. Finite life 📱",
      "You spent more time here than you think",
      "This habit stole time from your life",
      "You blink, and hours are gone"
    ],
    bad: [
      "This habit is burning more than money 🚬",
      "You’re paying to lose time and health",
      "This one hits harder than your wallet",
      "Expensive in every way"
    ],
    general: [
      "Small habit. Big damage.",
      "This isn’t cheap. It’s just frequent",
      "Future you is not happy about this",
      "You’re funding this more than your goals",
      "This adds up faster than you think"
    ]
  };

  // 🎲 Random pick from category
  const lines = savageLines[category];
  return lines[Math.floor(Math.random() * lines.length)];
}

module.exports = generateInsight;