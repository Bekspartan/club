# docs/schema.md

## 🗃️ SQL Server Tables Overview

### 🔐 Users
| Column       | Type       | Description              |
|--------------|------------|--------------------------|
| UserID       | INT        | Primary key              |
| Username     | VARCHAR    | Login name               |
| Email        | VARCHAR    | Contact                  |
| Role         | VARCHAR    | 'Admin' or 'Member'      |
| PasswordHash | VARCHAR    | Hashed password          |

---

### 👥 Members
| Column     | Type       | Description              |
|------------|------------|--------------------------|
| MemberID   | INT        | Primary key              |
| FullName   | VARCHAR    | Full member name         |
| Email      | VARCHAR    | Contact email            |
| Sport      | VARCHAR    | e.g., Tennis, Swimming   |
| DueDate    | DATE       | Next invoice due         |
| Amount     | DECIMAL    | Amount owed              |

---

### 📄 Contracts
| Column       | Type       | Description              |
|--------------|------------|--------------------------|
| ContractID   | INT        | Primary key              |
| MemberID     | INT        | FK → Members             |
| StartDate    | DATE       | Start of contract        |
| EndDate      | DATE       | End of contract          |
| ContractType | VARCHAR    | Type (e.g., full, trial) |

---

### 🧾 Invoices
| Column     | Type       | Description              |
|------------|------------|--------------------------|
| InvoiceID  | INT        | Primary key              |
| MemberID   | INT        | FK → Members             |
| Amount     | DECIMAL    | Total due                |
| Status     | VARCHAR    | 'Paid' or 'Unpaid'       |
| DueDate    | DATE       | When payment is due      |

---

### 🧠 Reports
| Column     | Type       | Description              |
|------------|------------|--------------------------|
| ReportID   | INT        | Primary key              |
| MemberID   | INT        | FK → Members             |
| ReportType | VARCHAR    | Category (e.g., health)  |
| ReportText | TEXT       | Details                  |
| CreatedAt  | DATETIME   | Timestamp                |

---

### 📬 Messages
| Column       | Type     | Description             |
|--------------|----------|-------------------------|
| MessageID    | INT      | Primary key             |
| Title        | VARCHAR  | Subject line            |
| Body         | TEXT     | Message content         |
| Recipient    | VARCHAR  | Email or 'All'          |
| SentBy       | VARCHAR  | Username                |
| ScheduledAt  | DATETIME | When to send            |

---

### 📦 Inventory
| Column     | Type     | Description             |
|------------|----------|-------------------------|
| ItemID     | INT      | Primary key             |
| Name       | VARCHAR  | Item name               |
| Category   | VARCHAR  | e.g., Equipment, Drink  |
| Condition  | VARCHAR  | Good, Damaged, etc.     |

---

### 📁 Documents
| Column      | Type     | Description            |
|-------------|----------|------------------------|
| DocumentID  | INT      | Primary key            |
| Title       | VARCHAR  | Document title         |
| Content     | TEXT     | HTML content           |
| Author      | VARCHAR  | Username               |
| CreatedAt   | DATETIME | Date saved             |
