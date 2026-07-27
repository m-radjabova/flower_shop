<div align="center">

# 🌸 Flower Shop — Premium Bouquet Delivery

> **"Every flower is a soul blossoming in nature."**

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![i18next](https://img.shields.io/badge/i18next-26A69A?style=for-the-badge&logo=i18next&logoColor=white)](https://www.i18next.com/)

<br/>

<img src="public/flower_icon.png" alt="Flower Shop Logo" width="120" />

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-FF6B9D?style=for-the-badge&logo=vercel&logoColor=white)](https://flower-shop-vert.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-ff69b4?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](https://github.com/m-radjabova/flower_shop/pulls)
[![Stars](https://img.shields.io/github/stars/m-radjabova/flower_shop?style=for-the-badge&color=gold)](https://github.com/m-radjabova/flower_shop/stargazers)

</div>

<br/>

---

<h2 align="center">
  🌷 <i>From Our Garden to Your Heart</i> 🌷
</h2>

<p align="center">
  A modern, full-featured e-commerce platform for flower bouquets — built with love, 
  React, and a sprinkle of magic. Browse by occasion, customize orders, chat with florists, 
  and have premium blooms delivered to your doorstep.
</p>

<br/>

## ✨ Features

<div align="center">

| 🌺 **Bouquet Catalog** | 🛒 **Smart Cart** | 💬 **Live Chat** |
|:---:|:---:|:---:|
| Browse by category, occasion & price | Real‑time totals & gift messages | Chat with shop owners |
| 📍 **Shop Locator** | ❤️ **Wishlist** | 🌐 **Multi‑language** |
| Find florists near you | Save your favourite arrangements | UZ / RU / EN |

</div>

<br/>

## 🛠️ Tech Stack

<div align="center">

| Category | Technologies |
|:---------|:-------------|
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) |
| **Styling** | ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) |
| **Backend** | ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black) ![Firestore](https://img.shields.io/badge/Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black) |
| **Auth** | ![Google Auth](https://img.shields.io/badge/Google_Auth-4285F4?style=flat-square&logo=google&logoColor=white) |
| **State & Data** | ![Context API](https://img.shields.io/badge/Context_API-61DAFB?style=flat-square&logo=react&logoColor=white) ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) |
| **i18n** | ![i18next](https://img.shields.io/badge/i18next-26A69A?style=flat-square&logo=i18next&logoColor=white) |
| **Deploy** | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white) |

</div>

<br/>

## 📁 Project Structure (At a Glance)

```
🌸 flower_shop_front/
├── 📂 public/              # Static assets, meta tags, sitemap
├── 📂 src/
│   ├── 📂 api/             # Firebase & REST API integrations
│   ├── 📂 assets/          # Images, icons, backgrounds
│   ├── 📂 components/      # Reusable UI components
│   │   ├── 📂 home/        # Home page sections
│   │   ├── 📂 catalog/     # Bouquet cards, reviews
│   │   ├── 📂 chat/        # Real‑time messaging
│   │   ├── 📂 orders/      # Order tracking & gift cards
│   │   └── 📂 shops/       # Shop badges & features
│   ├── 📂 pages/           # Route pages
│   │   ├── 📂 home/        # Landing, About, Occasions
│   │   ├── 📂 catalog/     # Shop, Detail, Cart, Checkout
│   │   ├── 📂 admin/       # Admin dashboard & CRUD
│   │   ├── 📂 owner/       # Shop owner panel
│   │   └── 📂 profile/     # User profile & settings
│   ├── 📂 hooks/           # Custom React hooks
│   ├── 📂 context/         # React Context providers
│   ├── 📂 locales/         # Translation files (uz, ru, en)
│   ├── 📂 types/           # TypeScript interfaces & types
│   └── 📂 utils/           # Helper functions
└── 📄 config files         # ESLint, Vite, TS configs
```

<br/>

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/m-radjabova/flower_shop.git
cd flower_shop_front

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase config

# Start the development server
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser — the app will hot‑reload on changes.

### Build for Production

```bash
npm run build    # Output → dist/
npm run preview  # Preview production build locally
```

<br/>

## 🌍 Internationalization (i18n)

| Language | Code | File |
|:---------|:-----|:-----|
| 🇺🇿 Uzbek | `uz` | `src/locales/uz.json` |
| 🇷🇺 Russian | `ru` | `src/locales/ru.json` |
| 🇬🇧 English | `en` | `src/locales/en.json` |

Add or modify translations in the respective JSON files. The app auto‑detects the user's browser language and falls back to English.

<br/>

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/m-radjabova/flower_shop/issues).

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<br/>

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<br/>

---

<div align="center">

### 🌻 Made with ❤️ and lots of 🌷🌹🌸

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-m--radjabova-181717?style=for-the-badge&logo=github)](https://github.com/m-radjabova)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://flower-shop-vert.vercel.app/)

<br/>

> *"Where flowers bloom, so does hope." — Lady Bird Johnson*

<br/>

<img src="public/cherryblossom.png" alt="Cherry Blossom" width="80" />

</div>