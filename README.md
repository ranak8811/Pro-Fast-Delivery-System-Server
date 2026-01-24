# Pro Fast Delivery System Server

This repository contains the backend server for the Pro Fast Delivery System application, built with Node.js and Express.js. It provides a robust API for managing users, business operations, employees (riders), payments, and tracking functionalities, leveraging MongoDB for data storage, Firebase for authentication, and Stripe for payment processing.

## Features

- **User Management**: Handle user registration, login, and role-based access control (Admin, Rider, User).
- **Business Operations**: Manage parcel/shift assignments and rider activities.
- **Employee (Rider) Management**: Dedicated functionalities for managing rider profiles and their assigned tasks.
- **Payment Processing**: Securely process payments using Stripe.
- **Tracking**: Track parcels or shifts with detailed status updates.
- **Authentication**: Secure API endpoints using Firebase Authentication.
- **CORS Configuration**: Handles Cross-Origin Resource Sharing for secure communication with client applications.

## Technologies Used

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web application framework for Node.js.
- **MongoDB**: NoSQL database for flexible data storage.
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB (inferred from common practice with MongoDB in Node.js, though not explicitly in `package.json`, `src/index.js` uses `MongoClient` directly).
- **Firebase Admin SDK**: For server-side Firebase authentication and authorization.
- **Stripe**: For handling payment gateway integrations.
- **`dotenv`**: To load environment variables from a `.env` file.
- **`cors`**: For enabling Cross-Origin Resource Sharing.

## Installation

To get the Zap-Shift Server up and running on your local machine, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ranak8811/Pro-Fast-Delivery-System-Server.git
    cd Pro-Fast-Delivery-System-Server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Environment Variables

This project uses environment variables for sensitive information and configuration. Create a `.env` file in the root directory of the project with the following variables:

```
PORT=5000
PAYMENT_GATEWAY_KEY=your_stripe_secret_key
FB_SERVICE_KEY=your_base64_encoded_firebase_service_account_json
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
```

- `PORT`: The port on which the server will run (e.g., `5000`).
- `PAYMENT_GATEWAY_KEY`: Your secret key from Stripe for payment processing.
- `FB_SERVICE_KEY`: A base64 encoded JSON string of your Firebase service account key. You can generate this from your Firebase project settings (`Project settings > Service accounts > Generate new private key`). After downloading the JSON, convert it to a base64 string.
- `DB_USER`: Your MongoDB Atlas (or local) database username.
- `DB_PASS`: Your MongoDB Atlas (or local) database password.

**Note on `FB_SERVICE_KEY`**: The service account JSON file should be converted to a base64 string before being placed in the `.env` file. You can do this using online tools or a simple script.

## Running the Application

Once you have installed the dependencies and configured your `.env` file, you can start the server:

```bash
node src/index.js
# Or, if you have a start script in package.json (currently not present, but good practice):
# npm start
```

The server will typically run on `http://localhost:5000` or the port you specified in your `.env` file.

## API Endpoints

The server exposes various API endpoints categorized by functionality:

- `/payment`: For handling payment-related operations via Stripe.
- `/users`: For user authentication, profile management, and role-based actions.
- `/business`: For business-specific operations, possibly involving parcel/shift creation and assignment.
- `/employee`: For managing employee (rider) specific data and actions.
- `/tracking`: For managing and retrieving tracking information for parcels or shifts.

Detailed endpoint documentation (e.g., specific routes, request/response bodies) would typically be found in the respective route files within the `src/routes/` directory.

## Deployment

This project includes `vercel.json`, indicating it is set up for deployment on [Vercel](https://vercel.com/). You can deploy it by connecting your Git repository to Vercel.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the ISC License. See the `LICENSE` file for details (if present, otherwise assume standard ISC terms).
