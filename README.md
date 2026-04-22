# 🛣️ RoadWatch AI: Smart Road Monitoring System

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

RoadWatch AI is a cutting-edge, AI-powered monitoring platform designed for road authorities in the **Salem District, Tamil Nadu**. It provides real-time detection, tracking, and alerting for road obstacles to enhance traffic safety and emergency response efficiency.

---

## 🚀 Key Features

- **🧠 AI Detection**: Utilizes advanced YOLOv8 + CNN models for high-accuracy (98%+) obstacle identification.
- **🕒 Real-Time Dashboard**: Comprehensive command center with live status updates and critical metrics.
- **🗺️ Interactive Map View**: Visualize the exact location of all reported obstacles across Salem District.
- **📊 Advanced Analytics**: Trend analysis and historical data reporting for strategic planning.
- **🔔 Smart Alert System**: Instant notifications via SMS (Twilio), Email (SMTP), and in-app sound alerts for high-severity incidents.
- **🔐 Secure Access**: Role-based access control with Supabase Auth, including Google OAuth and secure password recovery.
- **📱 Responsive Design**: Fully optimized for both high-resolution workstations and mobile field devices.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Lucide Icons |
| **Backend/BaaS** | Supabase (Authentication, Database, Real-time) |
| **State Management** | React Context API, TanStack Query |
| **Deployment** | Vite Build Pipeline |

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account & project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/road-watch-ai.git
   cd road-watch-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## 🏙️ Coverage Areas

Our system currently monitors critical junctions and roads including:
- Steel Plant Junction
- Five Roads
- Omalur Road
- Yercaud Foothills
- *And 8+ other key locations across Salem.*

---

## 🛡️ Security & Privacy

RoadWatch AI is built on a "Privacy by Design" framework. All activity within the dashboard is logged and monitored. Access is restricted to authorized road authority personnel through multi-factor authentication and secure sessions.

---

## 👨‍💻 Contributing

We welcome contributions to help improve road safety! Please feel free to submit pull requests or open issues for feature requests and bug reports.

## 📄 License

© 2026 Salem Road Authority • Smart City Initiative. All rights reserved. Registered for authorized personnel use only.
