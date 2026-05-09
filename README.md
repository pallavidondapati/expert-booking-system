# ⚡ ExpertLink — Real-Time Expert Session Booking System

A full-stack web application for booking 1:1 expert sessions with real-time slot availability updates.

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Express%20%7C%20MongoDB-orange)
![Real-time](https://img.shields.io/badge/Real--time-Socket.io-blue)

---

## 🚀 Features

### Core Features
- **Expert Listing** — Browse experts with search, category filters, and pagination
- **Expert Detail** — View expert profile with real-time slot availability
- **Booking System** — Full form with validation; prevents double booking
- **My Bookings** — Track session status by email (Pending / Confirmed / Completed)

### Critical Technical Features
- 🔒 **Race Condition Prevention** — MongoDB atomic `findOneAndUpdate` + compound unique index prevents double booking even under concurrent load
- ⚡ **Real-Time Slot Updates** — Socket.io broadcasts slot bookings to all connected clients instantly
- ✅ **Full Validation** — Client-side (React) + server-side (express-validator)
- 🏗 **Clean Architecture** — Separate routes / controllers / models structure
- 🌐 **Environment Variables** — `.env` for all config

---

## 📁 Project Structure

```
expert-booking/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── seed.js            # Demo data seeder
│   ├── controllers/
│   │   ├── expertController.js
│   │   └── bookingController.js
│   ├── middleware/
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── Expert.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── expertRoutes.js
│   │   └── bookingRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx / .css
    │   │   └── ExpertCard.jsx / .css
    │   ├── context/
    │   │   └── SocketContext.jsx   # Socket.io provider
    │   ├── pages/
    │   │   ├── ExpertListPage.jsx  # Search + Filter + Pagination
    │   │   ├── ExpertDetailPage.jsx # Real-time slots
    │   │   ├── BookingPage.jsx     # Booking form
    │   │   └── MyBookingsPage.jsx  # Track bookings
    │   ├── styles/
    │   │   └── global.css
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── index.js
    └── package.json
```

---

## 🛠 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd expert-booking
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run seed    # Seed 8 demo experts with slots
npm run dev     # Start backend on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm start       # Start React on port 3000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/experts` | List experts (pagination + filters) |
| `GET` | `/api/experts/categories` | All categories |
| `GET` | `/api/experts/:id` | Expert detail + slots grouped by date |
| `POST` | `/api/bookings` | Create booking (atomic, prevents double booking) |
| `GET` | `/api/bookings?email=` | Get bookings by email |
| `PATCH` | `/api/bookings/:id/status` | Update booking status |

### Query Parameters for GET /api/experts
- `page` — Page number (default: 1)
- `limit` — Results per page (default: 6)
- `category` — Filter by category
- `search` — Search by name or specialization
- `sortBy` — Sort field (default: rating)
- `order` — asc or desc

---

## 🔒 Double Booking Prevention

The system uses **two layers** of protection:

1. **MongoDB Atomic Update** (Primary):
```js
Expert.findOneAndUpdate(
  { _id: expertId, 'availableSlots': { $elemMatch: { date, time, isBooked: false } } },
  { $set: { 'availableSlots.$.isBooked': true } }
)
// Returns null if slot was already booked — another request won first
```

2. **Unique Compound Index** (Backup):
```js
bookingSchema.index({ expertId: 1, date: 1, timeSlot: 1 }, { unique: true })
// Database-level constraint catches any edge cases
```

Both operations run in a **MongoDB transaction** for full atomicity.

---

## ⚡ Real-Time Architecture

```
Client A books slot
    │
    ▼
POST /api/bookings
    │
    ▼
Slot marked as booked (atomic)
    │
    ▼
io.to('expert-{id}').emit('slot-booked', { date, timeSlot })
    │
    ▼
Client B (viewing same expert) receives event instantly
    │
    ▼
Slot UI updates to "Booked" without page refresh
```

Clients join expert-specific Socket.io rooms when viewing an expert's detail page.

---

## 🎨 Design System

- **Display Font**: Syne (bold, geometric)
- **Body Font**: DM Sans (clean, readable)
- **Color Palette**: Deep ink + warm surface + coral accent (#FF5C35)
- **Responsive**: Mobile-first, works on all screen sizes

---

## 🧪 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expert-booking
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 🚢 Deployment

### Backend (Railway / Render)
1. Set environment variables on the platform
2. `npm start` command
3. Enable MongoDB Atlas for production DB

### Frontend (Vercel / Netlify)
1. Set `REACT_APP_API_URL` to your deployed backend URL
2. `npm run build` → deploy `build/` folder

---

## 👨‍💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | Custom CSS (no UI library) |
| Real-time | Socket.io client |
| HTTP | Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose |
| Real-time | Socket.io server |
| Validation | express-validator |
| Transactions | MongoDB sessions |
