# HabiTax 💸

> **Your habits are taxing you. Find out how much.**

HabiTax is a mobile app that visualizes the true financial and time cost of your everyday habits. Not just what you spend — but what you *lose* — yearly, monthly, by the hour.

Built with **React Native (Expo)** for Android and **Node.js + MongoDB** for the backend.

---

## 📱 Screenshots

| Onboarding | Home | Add Habit |
|---|---|---|
| *(coming soon)* | *(coming soon)* | *(coming soon)* |

---

## ✨ Features

- 🔐 **Authentication** — Register, login, auto-login with JWT
- 💸 **Habit Tracking** — Add habits with cost-per-use, time-per-use, and frequency
- 📊 **Dashboard Stats** — Total yearly burn, monthly cost, hours and days lost
- 🔥 **Savage Insights** — AI-generated one-liners exposing your worst habits
- ✏️ **Edit & Delete** — Full CRUD for every tracked habit
- 👤 **User Profile** — Edit name, email, change password
- 🌱 **Onboarding** — 3-slide first-launch experience
- 📴 **Offline Banner** — Detects no-internet and shows cached data
- 🔄 **Auto-logout** — Handles expired tokens gracefully

---

## 🛠 Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React Native (Expo SDK 54) | Cross-platform mobile app |
| `@expo/vector-icons` (Ionicons) | UI icons |
| `@react-native-async-storage/async-storage` | Token storage |
| `axios` | HTTP client with interceptors |

### Backend
| Tool | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| nodemon | Dev server auto-reload |

---

## 📁 Project Structure

```
habitax/
├── backend/
│   ├── controllers/
│   │   ├── authController.js     # register, login, getProfile, updateProfile
│   │   └── habitController.js    # add, get, delete, update, dashboard
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   └── Habit.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── habitRoutes.js
│   ├── utils/
│   │   └── insightGenerator.js   # Savage insight logic
│   └── server.js
│
└── frontend/
    ├── assets/                   # App icon, splash, illustrations
    ├── src/
    │   ├── components/
    │   │   ├── DashboardCard.js
    │   │   ├── HabitCard.js
    │   │   ├── PillSelector.js
    │   │   └── SplashLoader.js
    │   ├── screens/
    │   │   ├── LoginScreen.js
    │   │   ├── RegisterScreen.js
    │   │   ├── HomeScreen.js
    │   │   ├── AddHabitScreen.js
    │   │   ├── EditHabitScreen.js
    │   │   ├── ProfileScreen.js
    │   │   └── OnboardingScreen.js
    │   ├── services/
    │   │   ├── api.js            # Axios instance with interceptors
    │   │   └── authEvents.js     # 401 auto-logout event bus
    │   └── theme/
    │       ├── colors.js
    │       ├── typography.js
    │       └── spacing.js
    └── App.js                    # State-machine navigation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Expo Go app on your Android device

### 1. Clone the repo

```bash
git clone https://github.com/darshild078/habitax.git
cd habitax
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the server:
```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Update the API base URL in `src/services/api.js` to match your machine's local IP:
```js
baseURL: "http://YOUR_LOCAL_IP:5000/api"
```

> **Tip:** Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your local IP.

Start Expo:
```bash
npx expo start
```

Scan the QR code with Expo Go on your Android device.

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/profile` | Get logged-in user profile |
| PUT | `/api/auth/profile` | Update name, email, or password |

### Habits
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/habits/add` | Add a new habit |
| GET | `/api/habits/get` | Get all habits for user |
| GET | `/api/habits/dashboard` | Get aggregated dashboard stats |
| PUT | `/api/habits/update/:id` | Update a habit |
| DELETE | `/api/habits/delete/:id` | Delete a habit |

All habit endpoints require `Authorization: <token>` header.

---

## 🔮 Roadmap

- [ ] Push notifications & reminders
- [ ] Streak counter
- [ ] Share your stats as a card
- [ ] Category filter and sort
- [ ] Dark mode
- [ ] Google Play Store release

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](./LICENSE) for details.

---

## 🙌 Author

**Darshil** — [@darshild078](https://github.com/darshild078)

> *"You burned more than a month of rent. Cold, honest, motivating. That's HabiTax."*
