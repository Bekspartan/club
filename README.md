# club
# Club Management System

A full-featured club management platform built with React (frontend), Express (backend), and SQL Server (database).

---

## 📦 Features

- ✅ Member management (add, edit, delete, search, unpaid filter)
- 📄 Contract creation and tracking
- 🧾 Invoice generation and status tracking
- 📈 Reports and member analytics
- 🗂️ Inventory tracking
- 📬 Automated messaging system
- 📝 Rich text document management
- 👥 User role system (Admin, Member)
- 🔐 Authentication + password reset
- 🌍 Self-hosted with local SQL Server

---

## ⚙️ Tech Stack

- Frontend: React + TailwindCSS + Axios
- Backend: Node.js + Express + mssql
- Database: SQL Server

---

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/club.git
cd club
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Set Up `.env`
Create a `.env` file in the root folder:
```env
PORT=5000
SQL_SERVER=localhost
SQL_DATABASE=ClubDB
SQL_USER=your_sql_user
SQL_PASSWORD=your_password
SQL_ENCRYPT=false
JWT_SECRET=your_jwt_secret
```

### 4. Start Backend Server
```bash
npm start
```
Runs at: `http://localhost:5000`

### 5. Install Frontend (already inside root)
```bash
npm install
```

### 6. Start Frontend Dev Server
```bash
npm run dev
```
Runs at: `http://localhost:3000`

---

## 🏗️ Production Deployment

### 1. Build the React Frontend
```bash
npm run build
```
This creates a `build/` folder.

### 2. Serve React from Express
Update `server.js` with:
```js
const path = require("path");
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});
```

### 3. Start Production Server
```bash
node server.js
```
App available at: `http://localhost:5000`

---

## ✅ Default Admin Credentials
If applicable, you can manually insert an admin in the `Users` table:
```sql
INSERT INTO Users (Username, Email, Role, PasswordHash)
VALUES ('admin', 'admin@club.com', 'Admin', 'hashed-password-here')
```

---

## 📁 File Structure
```
/club
├── /build              # Production frontend
├── /components         # Shared React components
├── /pages              # All UI pages
├── /api/*.js           # Express routes
├── db.js               # SQL Server connection
├── server.js           # Express app + static hosting
├── .env                # Environment variables
```

---

## ✨ Credits
Built by Bekspartan with contributions via MAC CENTERCOM documentation.
