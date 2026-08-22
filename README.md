<div align="center">

# 🚑 LIFELANE
### Clear the Way. Save Critical Time.

<p align="center">
  <b>A real-time emergency coordination platform connecting ambulances and traffic-response personnel.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/OSRM-000000?style=for-the-badge&logo=openstreetmap&logoColor=white" alt="OSRM" />
</p>

> **LIFELANE bridges the communication gap by providing traffic police with an ambulance's exact location, destination, route, and ETA in real-time, allowing intersections to be cleared *before* the ambulance arrives.**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Status: MVP](https://img.shields.io/badge/Status-MVP_Prototype-blue.svg)]()

<br/>
</div>

---

## 📑 Table of Contents
- [The Problem vs. The Solution](#-the-problem-vs-the-solution)
- [How it Works (Core Workflow)](#-how-it-works)
- [Role Capabilities](#-user-roles)
- [Technical Architecture](#-technical-architecture)
- [Comprehensive Tech Stack](#-comprehensive-tech-stack)
- [Setup & Local Development](#-setup--local-development)
- [Roadmap & Future ML Vision](#-roadmap--future-vision)
- [Limitations & Disclaimers](#-limitations)

---

## 🛑 The Problem vs. The Solution

<table width="100%">
<tr>
<td width="50%" valign="top">
<h3>❌ Traditional Routing</h3>
<p>Information is fragmented. Sirens only warn drivers within a few hundred meters. The ambulance knows where it is going, but the police handling the intersections have zero advance visibility.</p>
<code>🚑 Ambulance → Traffic → Police (Unaware)</code>
</td>
<td width="50%" valign="top">
<h3>✅ The LIFELANE Approach</h3>
<p>Instantly synchronize the emergency state. By capturing live Browser GPS and broadcasting it over WebSockets, traffic responders can proactively clear the corridor.</p>
<code>🚑 Ambulance → 📍 GPS → 🚨 SOS → 👮 Police</code>
</td>
</tr>
</table>

---

## 🔄 How It Works

> [!IMPORTANT]
> **LIFELANE MVP:** The current working prototype is a synchronized two-device flow ensuring real-time operational visibility.

```mermaid
sequenceDiagram
    participant A as 🚑 Ambulance App
    participant E as Express API Proxy
    participant O as OSRM / Google
    participant S as Supabase (Realtime)
    participant P as 👮 Police Dashboard

    A->>A: 📍 Acquire Browser GPS
    A->>E: Search Nearby Hospitals
    E->>O: Proxy to Google Places API
    O-->>A: Return Hospital List
    A->>O: Request Route to Hospital
    O-->>A: Return Polyline & ETA
    A->>S: 🚨 Trigger SOS (PostgreSQL Insert)
    S-->>P: ⚡ WebSocket Broadcast (Incident Active)
    P->>S: ✅ Accept Corridor (PostgreSQL Update)
    S-->>A: ⚡ WebSocket Broadcast (Police Assisting)
    A->>S: Continuous GPS Stream Update
    S-->>P: Continuous UI Map Update
```

---

## 👥 User Roles

<div align="center">
  
| 🚑 Ambulance Operator | 👮 Traffic Police | 🛡️ Administrator |
| :--- | :--- | :--- |
| **Mobile-First Interface** | **Dark-Themed Operations Desk** | **High-Level Analytics Desk** |
| • Live GPS tracking<br>• Hospital destination search<br>• OSRM Route & ETA Preview<br>• One-tap SOS trigger<br>• AERO AI Assistance | • Multi-feed global map view<br>• Instant incoming SOS alerts<br>• Route & destination visibility<br>• Acknowledge & manage corridor | • Active emergency roster<br>• Fleet visibility monitoring<br>• System analytics |

</div>

---

## 🏗️ Technical Architecture

<details>
<summary><b>Click to expand detailed Architecture Diagram</b></summary>
<br>

```mermaid
flowchart TB
    subgraph CLIENT["Client Applications"]
        AMB["🚑 Ambulance Mobile UI"]
        POL["👮 Police Desktop UI"]
    end

    subgraph FRONTEND["Frontend Engine"]
        REACT["React 19 + TypeScript"]
        VITE["Vite 8"]
        TAILWIND["Tailwind CSS v4"]
        MAP["Leaflet + React-Leaflet"]
        GPS["Browser Geolocation API"]
    end

    subgraph SERVER["Secure API Gateway"]
        EXPRESS["Node.js + Express"]
        PLACES["Google Places API"]
        GROQ["Groq / Llama 3.3"]
    end

    subgraph BACKEND["Data & Realtime (Supabase)"]
        AUTH["Supabase Auth (JWT)"]
        DB["PostgreSQL"]
        RLS["Row Level Security"]
        REALTIME["Supabase Realtime (WebSockets)"]
    end

    subgraph ROUTING["Routing Engine"]
        OSRM["OSRM API"]
    end

    AMB --> REACT
    POL --> REACT

    REACT --> VITE
    REACT --> TAILWIND
    REACT --> MAP
    REACT --> GPS

    REACT --> EXPRESS
    EXPRESS --> PLACES
    EXPRESS --> GROQ

    REACT --> AUTH
    REACT --> DB
    REACT --> REALTIME
    DB --> RLS

    REACT --> OSRM
```
</details>

### 📡 Data Flow Deep Dive
- **GPS Engine:** Built strictly on `navigator.geolocation.watchPosition()`, tracking high-accuracy coordinates, speed, and heading. Includes robust fallback states (`denied`, `searching`, `stale`).
- **Realtime Sync:** Rather than managing custom WebSockets and Redis, LIFELANE leverages **Supabase Realtime**, subscribing React clients directly to PostgreSQL logical replication logs.
- **Security:** Node.js/Express acts exclusively as a secure proxy to prevent exposing Google Places and Groq API keys to the client browser. Authorization is handled at the database level via Supabase RLS.

---

## 💻 Comprehensive Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 | Builds the highly reactive web application |
| **Build Tool** | Vite 8 | Ultra-fast development server and production builds |
| **Language** | TypeScript | Ensures type-safe enterprise-grade code |
| **UI / Styling** | Tailwind CSS v4 | Rapid styling and responsive UI design |
| **Mapping Engine** | Leaflet & React-Leaflet | Renders interactive maps and custom SVG markers |
| **GPS** | Browser Geolocation API | Acquires and streams live ambulance location |
| **Routing** | OSRM | Calculates exact road network routes, distance, and ETA |
| **API Gateway** | Node.js & Express.js | Securely proxies requests to external paid APIs |
| **Backend & DB** | Supabase (PostgreSQL) | Serves as the core relational database and BaaS |
| **Auth & Security** | Supabase Auth & RLS | Manages JWT sessions and strict Row Level Security |
| **State Sync** | Supabase Realtime | Broadcasts live emergency coordinates across clients |
| **Hospital Discovery** | Google Places API | Locates valid nearby medical facilities dynamically |
| **AI Inference** | Groq API (Llama 3.3) | Powers the AERO AI conversational assistant |
| **Analytics** | Recharts | Powers administrative charts and metric visualization |

---

## 🚀 Setup & Local Development

> [!NOTE]
> **Prerequisites:** Node.js (v18+), a Supabase project, a Groq API Key, and a Google Maps API Key.

**1. Clone the Repository**
```bash
git clone https://github.com/your-username/AERO-main.git
cd AERO-main
```

**2. Install Dependencies**
```bash
npm install
```

**3. Configure Environment**
Create a `.env` file in the root directory:
```env
# Frontend (Vite)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Proxies (Express)
GROQ_API_KEY=your_groq_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**4. Provision Database**
1. Open your Supabase SQL Editor.
2. Execute the entire `supabase/full_setup.sql` script to generate tables and RLS policies.
3. Promote your police user account to the correct role:
   ```sql
   UPDATE profiles SET role = 'traffic_operator' WHERE email = 'police@example.com';
   ```

**5. Launch Development Servers**
```bash
npm run dev
```
*(Utilizes `concurrently` to spin up both Vite and Express instantly).*

---

## 🛤️ Roadmap & Future Vision

While the current architecture successfully proves the real-time coordination model, LIFELANE's enterprise roadmap includes migrating to a heavier Python-based data infrastructure.

<details>
<summary><b>View Planned Future Architecture</b></summary>
<br>

```mermaid
flowchart LR
    AMB["🚑 Ambulances"] --> API["API Gateway"]
    API --> FASTAPI["FastAPI (Python)"]
    FASTAPI --> POSTGIS["PostgreSQL + PostGIS"]
    FASTAPI --> REDIS["Redis Caching"]
    FASTAPI --> WS["Dedicated WebSockets"]
    FASTAPI --> ML["Predictive ML (Scikit-learn)"]
    WS --> TRAFFIC["👮 Traffic Units"]
```
</details>

### 🔮 Future AI / ML Capabilities
Currently, AI is utilized strictly for the **AERO Conversational Assistant** via Groq/Llama. Future phases will introduce predictive ML models to:
- Dynamically adjust ETAs based on historic congestion anomalies.
- Intelligently position idle ambulance fleets based on predicted emergency demand.

---

## ⚠️ Limitations

> [!WARNING]
> **Prototype Disclaimer:** LIFELANE is an advanced development project demonstrating emergency-response coordination concepts. It is **not** a replacement for official medical dispatch systems or government traffic-control infrastructure.

- **GPS Dependency:** Accuracy relies entirely on the device hardware and browser OS permissions.
- **Traffic Interfacing:** LIFELANE provides visibility to human operators; it does not currently interface with physical municipal traffic lights.
- **Production Readiness:** Full deployment requires rigorous load testing, Dockerization, CI/CD pipelines, and extensive security penetration testing.

---

<div align="center">
  <p>Built with precision for emergency coordination.</p>
</div>
