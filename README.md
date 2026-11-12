# Pro-Fast Delivery System Server

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" /></a>
  <a href="https://www.mongodb.com"><img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  <a href="https://firebase.google.com"><img src="https://img.shields.io/badge/Firebase_Admin-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase Admin" /></a>
  <a href="https://stripe.com"><img src="https://img.shields.io/badge/Stripe_API-008CDD?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe API" /></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
</p>

The backend REST API server powering the Pro-Fast Delivery System platform, built with Node.js, Express, TypeScript, and MongoDB. Provides secure role-based services for parcel logistics, rider fleets, Stripe payment processing, and tracking telemetry.

## Live Endpoints & Client

- **Production API Server:** [https://pro-fast-delivery-system-server.vercel.app/](https://pro-fast-delivery-system-server.vercel.app/)
- **Live Client Web Application:** [https://zap-shift-abec3.web.app/](https://zap-shift-abec3.web.app/)
- **Frontend GitHub Repository:** [Pro-Fast-Delivery-System-Client](https://github.com/ranak8811/Pro-Fast-Delivery-System-Client.git)

---

## Core Capabilities

- **Server-Side Pagination & Search:** High-performance pagination utility (`src/utils/pagination.ts`) returning structured `{ data, total, page, limit, totalPages }` payloads for queries with `page` and `limit`, while retaining full backward compatibility for legacy callers.
- **Role-Based Access Control (RBAC):** Firebase Admin SDK token verification with dedicated route guards (`verifyFBToken`, `verifyAdmin`, `verifyRider`).
- **Logistics & Business Management:** Complete parcel booking, assignment to delivery personnel, and real-time status transitions (`not_collected`, `rider_assigned`, `in_transit`, `delivered`).
- **Fleet Management:** Rider application processing, active fleet directories, and workload balancing.
- **Stripe Payments Integration:** Secure payment intent generation, transaction logging, and revenue metrics.
- **AI Tracking Telemetry:** Endpoints for timeline event tracking and AI milestone generation.
- **Configured CORS:** Granular origin matching supporting both local development environments and the deployed Firebase client origin.

---

## Paginated API Endpoints

All major list endpoints support query parameters `?page=1&limit=10&search=keyword`:

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/business` | `GET` | User / Admin | Paginated list of parcels with status & search filters |
| `/business/rider/completed-parcels` | `GET` | Rider | Paginated list of completed deliveries for a specific rider |
| `/payment/history` | `GET` | User | Paginated payment transaction history |
| `/employee/riders/pending` | `GET` | Admin | Paginated pending rider applications |
| `/employee/riders/active` | `GET` | Admin | Paginated active riders fleet directory |
| `/employee/parcels` | `GET` | Rider | Paginated deliveries assigned to a rider |
| `/users/parcels` | `GET` | User | Paginated parcels created by a user |
| `/users/search` | `GET` | Admin | Paginated user search by email or name |

---

## Technologies Used

<div align="center">

| Category | Technologies & Tools |
|---|---|
| **Runtime & Language** | ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![JavaScript](https://img.shields.io/badge/ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) |
| **Backend Framework** | ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) |
| **Database & ODM** | ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) ![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-00ED64?style=for-the-badge&logo=mongodb&logoColor=black) |
| **Authentication & Security** | ![Firebase Admin](https://img.shields.io/badge/Firebase_Admin-FFCA28?style=for-the-badge&logo=firebase&logoColor=black) ![JSON Web Tokens](https://img.shields.io/badge/JWT_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) |
| **Payment Gateway** | ![Stripe API](https://img.shields.io/badge/Stripe_SDK-008CDD?style=for-the-badge&logo=stripe&logoColor=white) |
| **Deployment & Cloud** | ![Vercel](https://img.shields.io/badge/Vercel_Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white) |

</div>

---

## Getting Started

### Prerequisites
- Node.js (v18.0 or higher)
- MongoDB instance (MongoDB Atlas or local)
- Firebase project with Service Account credentials
- Stripe account secret key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ranak8811/Pro-Fast-Delivery-System-Server.git
   cd Pro-Fast-Delivery-System-Server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root:
   ```env
   PORT=5000
   DB_USER=your_mongodb_username
   DB_PASS=your_mongodb_password
   PAYMENT_GATEWAY_KEY=sk_test_your_stripe_secret_key
   FB_SERVICE_KEY=your_base64_encoded_firebase_service_account_json
   GEMINI_API_KEY=your_optional_gemini_api_key
   ```

4. **Build and Run:**
   ```bash
   # Development mode with live reload
   npm run dev

   # Compile TypeScript
   npm run build

   # Start production server
   npm start
   ```

---

## Project Structure

```
Pro-Fast-Delivery-System-Server/
├── src/
│   ├── config/              # Firebase admin and service configurations
│   ├── controllers/         # Business, employee, payment, user, tracking controllers
│   ├── middlewares/         # verifyFBToken, verifyAdmin, verifyRider
│   ├── routes/              # Express API route modules
│   ├── utils/               # pagination.ts and helper functions
│   └── index.ts             # Server entry point and database connection
├── dist/                    # Compiled JavaScript output
├── vercel.json              # Vercel deployment configuration
├── tsconfig.json            # TypeScript compiler options
└── package.json
```

---

## License

This project is licensed under the ISC License.
