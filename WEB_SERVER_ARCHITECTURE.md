

The Web + Server component is the **administrative control center** for the placement management system. It consists of:

1. **Backend API Server** - Handles all data and business logic
2. **Admin Web Dashboard** - User interface for administrators

Together, they enable admins to manage the entire placement process from a web browser.

---

## Backend API Server

### What It Does

The server is the **central hub** that:
- Stores all placement data in a PostgreSQL database (Supabase)
- Authenticates admins and students using secure tokens
- Enforces access control (main admins vs branch admins)
- Provides REST API endpoints for web and mobile apps
- Manages permissions and data security

### What Data It Handles

**Student Data**:
- Registration ID, name, email, phone
- Branch, CGPA, date of birth
- Academic details and profile completion status

**Placement Drive Data**:
- Company name, job role, description
- Salary package, location
- Eligible branches, minimum CGPA requirement
- Application deadline, drive status (draft/published/closed)

**Application Data**:
- Which student applied to which drive
- Application status (pending/accepted/rejected/waitlist)
- Application timestamps

**Admin Data**:
- Admin email, password (encrypted)
- Admin type (main-admin or branch-admin)
- Branch assignment for branch admins

**Notifications**:
- Notification text and timestamp
- Target students (by branch or all)
- Read/unread status

### How It Works

**Role-Based Access Control**:
- **Main Admins**: Can see and manage everything across all branches
- **Branch Admins**: Can only manage data for their specific branch (e.g., CSE, ECE)
- **Students**: Can only access their own data

**Security Features**:
- Row Level Security (RLS) at database level
- JWT tokens for authentication (30-day validity)
- Password encryption
- Service role keys for backend operations

**API Endpoints**:
- Authentication endpoints for login/registration
- CRUD operations for students, drives, applications
- Report generation and data export
- Notification delivery

---

## Admin Web Dashboard

### What It Does

The web dashboard is a **modern React application** that allows administrators to:
- View and manage all students in their branch/university
- Create, edit, and publish placement drives
- Track applications and update their status
- Send notifications to students
- Generate reports and export data to Excel
- Manage other admin accounts (main admins only)

### What Data It Shows

**Dashboard Overview**:
- Total number of students
- Active placement drives count
- Pending applications count
- Recent activity feed

**Students Page**:
- Complete list of registered students
- Filter by branch, CGPA, profile completion
- Search by name or registration ID
- Export student data to Excel

**My Drives Page**:
- All placement drives created by the admin or their branch
- Create new drives with company details
- Edit existing drives (company, salary, eligibility, deadline)
- Publish drives to make them visible to students
- View applicant reports for each drive
- Delete drives

**Applications Page**:
- All applications for drives under admin's control
- Filter by drive, status, or branch
- Update application status (accept/reject/waitlist)
- View student details for each application

**Notifications Page**:
- Send announcements to students
- Target specific branches or all students
- View notification history

### How Admins Use It

1. **Login** with email and password
2. **Navigate** using the sidebar menu
3. **Create drives** by filling a form with company details, eligibility criteria, and deadline
4. **Publish drives** to make them visible to eligible students
5. **Review applications** as students apply
6. **Update status** to inform students of acceptance/rejection
7. **Send notifications** for important updates

### Branch Filtering

- **Main Admins** see a branch filter dropdown on every page and can view/manage all branches
- **Branch Admins** automatically see only their branch's data with no option to switch

---

## How They Work Together

```
Student Mobile App
       ↓
   [API Server] ← Admin Web Dashboard
       ↓
   [Database]
```

**Flow Example - Publishing a Drive**:
1. Admin logs into web dashboard
2. Admin creates new drive with details (company, role, salary, eligibility)
3. Dashboard sends data to API server
4. Server saves drive to database with status "draft"
5. Admin clicks "Publish"
6. Server changes status to "published"
7. Student app fetches drives and shows the new drive to eligible students
8. Students apply through mobile app
9. Admin sees applications in dashboard and updates status

---

## Technology Stack

**Backend Server**:
- Node.js with Express framework
- TypeScript for type safety
- Supabase PostgreSQL database
- JWT for authentication

**Admin Web**:
- React with Vite for fast builds
- TypeScript for type safety
- Tailwind CSS + shadcn/ui for modern UI
- Responsive design (works on desktop, tablet, mobile browsers)

---

## Key Features

**Security**:
- Encrypted passwords
- Secure token-based authentication
- Role-based access control
- Database-level security policies

**Scalability**:
- Handles thousands of students and drives
- Efficient database queries with filtering
- Pagination for large datasets

**User Experience**:
- Modern, clean interface
- Fast loading with optimized queries
- Real-time data updates
- Search and filter on all pages

**Reporting**:
- Generate applicant reports per drive
- Export student data to Excel
- View statistics and analytics

---

## Summary

The Web + Server architecture provides a **robust administrative platform** for managing the entire placement process. Admins can control everything from student registration to final placement status through an intuitive web interface, while the backend ensures data security, proper permissions, and seamless integration with the student mobile app.
