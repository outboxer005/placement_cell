# Mobile App Architecture

## What It Is

The mobile app is a **Flutter-based Android application** for students to manage their complete placement journey. It provides a comprehensive student-facing experience from registration and profile creation to applying for placement drives and tracking applications.

---

## What It Does

The student mobile app empowers students to:
- **Register and Login** using their university Registration ID
- **Complete detailed academic and personal profiles** with multi-step forms
- **Browse available placement drives** with real-time eligibility status
- **Apply to job opportunities** that match their qualifications
- **Track application status** with color-coded visual indicators
- **Receive real-time notifications** about drives, deadlines, and status updates
- **Manage profile information** including identity documents
- **Configure app settings** (server connection, theme preferences)
- **Stay organized** throughout the entire placement process

---

## What Data It Handles

### Student Profile Data

The app collects and manages comprehensive student information:

**Personal Information**:
- First name and last name (surname)
- Date of birth
- Gender (Male/Female/Other)
- Nationality (default: India)
- Father's name
- Home addresses (permanent and present)

**Contact Information**:
- Primary email address
- Alternate email address (optional)
- Primary phone number
- Alternate/emergency contact number (optional)

**Identity Documents** (NEW):
- Aadhar card number (12 digits, optional)
- PAN card number (10 alphanumeric, optional)
- Stored securely for verification purposes

**Academic Information**:
- Registration ID (unique university identifier, e.g., VU2025001)
- Branch/Department (CSE, ECE, MECH, CIVIL, etc.)
- Current CGPA (0.0 to 10.0 scale)
- Expected graduation year
- Section/Division (A, B, C, etc.)
- Resume/Portfolio URL
- Break in studies indicator (Yes/No)
- Pending backlogs indicator (Yes/No)

**Education History**:
- **Degree/B.Tech**: Course name, institution, board/university, marks, percentage, duration
- **Intermediate/12th**: Course name, institution, board, marks, percentage, duration  
- **SSC/10th**: Course name, institution, board, marks, percentage, duration

**Address Information**:
- **Permanent Address**: House number, street, area, city, state, postal code, country
- **Present Address**: Same fields as permanent (can copy from permanent address)

**Account Information**:
- Login authentication token (JWT, stored securely)
- Profile completion status (percentage)
- Theme preference (Light/Dark/System)
- Last login timestamp

### Placement Drive Data

Students can view comprehensive drive information:

**Basic Drive Details**:
- Company name and logo
- Job role/position title
- Detailed job description and responsibilities
- Package details (salary, stipend, or both)
- Job location(s)
- Drive type (On-Campus/Off-Campus)

**Eligibility Criteria**:
- Eligible branches (displayed as chips)
- Minimum CGPA requirement (with clear threshold)
- Backlog policy (allowed or not)
- Application deadline (with countdown timer)

**Eligibility Status**:
- Real-time check against student's profile
- **Green badge** = Eligible to apply
- **Red badge** = Not eligible (with reason)
- Automatic filtering based on branch and CGPA

### Application Data

The app comprehensively tracks all student applications:

**Application Details**:
- Drive/company applied to
- Application status with color coding:
  - **🟡 Pending**: Under review by placement cell
  - **🟢 Accepted**: Selected for next round or final placement
  - **🔴 Rejected**: Application not successful
  - **🔵 Waitlist**: On waiting list, may be considered later
- Application submission date and time
- Status update timestamp

**Application Management**:
- Withdraw application feature (for pending applications)
- View full drive details from application card
- Filter and sort applications by status or date

### Notification Data

Students receive various types of notifications:

**Notification Types**:
- **New Drive Posted**: When a drive matching student's branch is published
- **Application Status Update**: When admin changes application status
- **Deadline Reminder**: Approaching deadlines for drives
- **General Announcements**: Important placement-related updates from admin
- **Data Request**: When admin requests specific profile information

**Notification Features**:
- Read/unread status tracking
- Notification badge counts on tabs
- Timestamp for each notification
- Deep linking to relevant drive or application
- Mark as read functionality

---

## How It Works

### Registration & Authentication Flow

**First-Time Registration (New Student)**:
1. Student opens the app and sees the login screen
2. Taps "Create Account" or "Register" button
3. Enters basic information in a multi-step form:
   - **Step 1 - Personal Info**: Registration ID, name, DOB, gender, nationality, branch
   - **Step 2 - Contact & Academic**: Email, phone, CGPA, year, section, resume URL, identity documents (Aadhar/PAN)
   - **Step 3 - Addresses**: Permanent and present addresses (can copy)
   - **Step 4 - Education**: Degree, Intermediate, SSC details with marks and institutions
4. Submits the form, creating account on server
5. Receives authentication token automatically
6. Redirected to main app (Drives screen)
7. Can complete or update profile anytime from Profile tab

**Returning Login**:
1. Student opens app and taps "Already have an account? Login"
2. Enters Registration ID (e.g., VU2025001)
3. Enters password (default: DOB in DDMMYYYY format, e.g., 15012002)
4. App validates credentials with server
5. Receives fresh authentication token
6. Logged in and redirected to Drives screen

**Auto-Login**:
- If valid token exists in secure storage, app logs in automatically
- No need to enter credentials every time
- Token expires after 30 days for security

**Profile Management**:
- Students can view complete profile from Profile tab
- Tap "Edit Profile" button to update information
- Multi-step modal form appears with current data pre-filled
- Can update contact info, academic details, addresses
- Changes sync immediately with server
- Profile completion percentage shown if incomplete

### Browsing Placement Drives

**Drives Screen (Home Tab)**:
- **Grid or List View**: Toggle between views using top-right button
- **Search Bar**: Search by company name or job role
- **Filter Chips**: Quick filters for branch, CGPA, deadline
- **Pull-to-Refresh**: Swipe down to fetch latest drives
- **Real-time Eligibility**: Each drive card shows if student is eligible

**Drive Cards Display**:
- Company name in bold
- Job role/position
- Package amount (₹ symbol for salary)
- Location (city)
- Eligibility badge (Green = Eligible, Red = Not Eligible)
- Application deadline
- Beautiful card design with shadows and hover effects

**Automatic Filtering**:
- Server automatically filters drives based on:
  - Published status (only published drives shown)
  - Student eligibility (but shows all with clear indicators)
- Students see all relevant opportunities

**Drive Details Screen**:
- **Hero Animation**: Smooth transition from list
- **Company Header**: Logo, name, and location
- **Job Information**: Full description, package, responsibilities
- **Eligibility Section**: Shows requirements and student's match status
- **Deadline Countdown**: Time remaining to apply
- **Action Button**: 
  - "Apply Now" if eligible and not applied
  - "Already Applied" if applied (disabled, shows status)
  - "Not Eligible" if doesn't meet criteria (disabled, shows reason)

### Applying to Placement Drives

**Application Process**:
1. Student browses drives and opens one they're interested in
2. Checks eligibility badge (must be green)
3. Reviews job description and requirements
4. Taps "Apply Now" button
5. Confirmation dialog appears ("Are you sure you want to apply?")
6. Student confirms application
7. App sends application to server with student ID and drive ID
8. Server validates:
   - Student is eligible (branch + CGPA)
   - Student hasn't already applied
   - Profile is sufficiently complete
9. Application record created in database with "Pending" status
10. Success message shown to student
11. Application immediately appears in "My Applications" tab
12. Button changes to "Already Applied" (disabled)

**Eligibility Requirements**:
- ✅ Student's branch must be in drive's eligible branches list
- ✅ Student's CGPA must meet or exceed minimum requirement
- ✅ If drive specifies no backlogs, student must have zero backlogs
- ✅ Profile must have minimum required information (name, email, phone)
- ✅ Cannot apply twice to the same drive

**What Happens If Not Eligible**:
- Apply button is disabled and grayed out
- Badge shows "Not Eligible" in red
- Tooltip or message explains why (e.g., "CGPA below requirement: Needs 7.5, yours is 7.0")

### Tracking Applications

**My Applications Tab**:
- Shows all drives the student has applied to
- Each application card displays:
  - Company name and logo
  - Job role
  - Application date
  - **Color-coded status badge**:
    - 🟡 Yellow = Pending
    - 🟢 Green = Accepted
    - 🔴 Red = Rejected
    - 🔵 Blue = Waitlist

**Application Card Actions**:
- **Tap Card**: Opens full drive details
- **Withdraw Button**: Appears for pending applications
  - Only shows if status is "Pending"
  - Confirmation dialog before withdrawal
  - Removes application from list after withdrawal

**Status Updates**:
- When placement admin updates status on web dashboard, change syncs immediately
- Student receives push notification (if enabled)
- Badge count appears on Applications tab
- Status automatically refreshes on pull-down

**Filtering & Sorting**:
- Filter by status (All/Pending/Accepted/Rejected/Waitlist)
- Sort by application date (newest first)
- Search by company name

### Notifications System

**Notifications Tab**:
- Chronological list of all notifications
- Unread notifications highlighted with bold text
- Each notification shows:
  - Title (e.g., "New Drive Available")
  - Message (brief description)
  - Timestamp (e.g., "2 hours ago", "Yesterday")
  - Read/Unread indicator (blue dot for unread)

**Notification Types & Actions**:
1. **New Drive Notification**: 
   - Tap → Opens drive detail screen
   - Shows drive ID and basic info
2. **Application Status Update**: 
   - Tap → Opens application status screen
   - Shows new status (Accepted/Rejected/Waitlist)
3. **Admin Broadcast**: 
   - Tap → Shows full message in dialog
   - General announcements, deadline reminders
4. **Data Request**: 
   - Tap → Opens profile edit screen with requested fields highlighted
   - Admin requests specific profile updates

**Notification Management**:
- Pull-to-refresh to fetch latest notifications
- Mark as read by tapping notification
- Badge count on Notifications tab shows unread count
- Clear all read notifications option

**Push Notifications** (Optional, requires Firebase):
- Real-time push notifications when app is closed
- Device token registered with server
- Notifications appear in system tray
- Tap notification → Opens app to relevant screen

### Profile & Settings

**Profile Tab**:
- **Profile Summary Card**: Name, Registration ID, Branch, CGPA, Year, Nationality
- **Contact & Access Card**: Email, phone, alternate contacts, resume URL
- **Identity Documents Card**: Aadhar and PAN (shown only if provided)
- **Addresses Card**: Permanent and present addresses side-by-side
- **Academic History Card**: Degree, Intermediate, SSC details
- **Edit Profile Button**: Opens multi-step edit modal
- **Logout Button**: Clears session and returns to login

**Settings Tab**:
- **Server Configuration**:
  - API Host input field (IP address of backend server)
  - Port is fixed at 4000
  - Example: `192.168.1.100` for local network
  - Useful for testing on different networks
- **Theme Selection**:
  - System default (follows device theme)
  - Light mode (white background)
  - Dark mode (dark background)
- **Profile Quick Access**: Link to Profile tab
- **About Section**: App version, build number
- **Logout**: Clears authentication and returns to login

---

## User Interface & Design

### Design Philosophy

The app follows **modern Material Design 3** principles with:
- **Premium Color Palette**: Indigo and purple gradients
- **Professional Typography**: Inter font family from Google Fonts
- **Smooth Animations**: Hero transitions, fade-ins, slide-ups
- **Responsive Layouts**: Adapts to different screen sizes and orientations
- **Accessibility**: High contrast, readable text, clear touch targets
- **Intuitive Navigation**: Bottom tab bar with icon + label

### Visual Design Elements

**Color Scheme**:
- Primary: Indigo (Blue-Purple)
- Accent: Purple
- Success: Green (for accepted applications, eligible status)
- Warning: Amber (for pending status, deadlines)
- Error: Red (for rejected applications, not eligible)
- Info: Blue (for waitlist, notifications)

**Typography**:
- Headlines: Inter Bold (24-32px)
- Titles: Inter Semibold (18-20px)
- Body: Inter Regular (14-16px)
- Captions: Inter Regular (12px)

**Card Design**:
- Rounded corners (12-16px radius)
- Subtle shadows (elevation 2-4)
- White background in light mode, dark gray in dark mode
- Padding: 16px internally

**Button Styles**:
- Primary: Filled with gradient background
- Secondary: Outlined with border
- Disabled: Grayed out with reduced opacity
- Labels always uppercase for emphasis

### Main Screens Breakdown

**1. Login/Registration Screen**:
- **Header**: University logo and app title
- **Input Card**: Registration ID and password fields
- **Action Button**: Login button with loading state
- **Toggle Link**: "Don't have an account? Register" (switches to registration flow)
- **Footer**: App version and copyright

**2. Registration Flow (Multi-Step)**:
- **Progress Stepper**: Shows current step (1 of 4, 2 of 4, etc.)
- **Step 1 - Personal Info**: 
  - Registration ID, First Name, Last Name, Father's Name
  - Date of Birth (calendar picker)
  - Gender (dropdown), Nationality (text field with India default)
  - Branch (dropdown), College (text field)
- **Step 2 - Contact & Academic**:
  - Email, Alternate Email
  - Phone, Alternate Phone
  - CGPA, Graduation Year, Section
  - Resume URL
  - **Identity Documents Section** (NEW):
    - Aadhar Card Number (12 digits, optional)
    - PAN Card Number (10 alphanumeric, optional)
  - Breaks in Studies (toggle), Backlogs (toggle)
- **Step 3 - Addresses**:
  - Permanent Address (house, street, area, city, state, postal code, country)
  - "Copy to Present Address" button
  - Present Address (same fields)
- **Step 4 - Education History**:
  - Degree: Course name, institution, board, marks, percentage, duration
  - Intermediate: Same fields
  - SSC: Same fields
- **Navigation**: Back, Next, Submit buttons
- **Validation**: Real-time validation with error messages

**3. Drives Screen (Home)**:
- **Top Bar**: 
  - Search icon → Opens search field
  - Filter icon → Shows filter bottomsheet
  - Grid/List toggle button
- **Profile Completion Banner** (if incomplete):
  - Yellow background
  - "Complete your profile to apply to drives" message
  - "Complete Now" button
- **Drives Grid/List**:
  - Grid: 2 columns with square cards
  - List: Single column with wide cards
  - Each card shows company, role, package, location, eligibility badge
- **Empty State**: "No drives available" message with illustration
- **Pull-to-Refresh**: Circular progress indicator

**4. Drive Detail Screen**:
- **Hero Header**: Company logo with blur background
- **Title Section**: Company name, job role, location
- **Package Card**: Salary/package prominently displayed
- **Description Section**: Full job description (expandable if long)
- **Eligibility Card**:
  - Checklist of requirements
  - Student's match status for each
  - Overall eligibility badge
- **Deadline Section**: Countdown timer with urgency color coding
- **Apply Button**: 
  - Large, full-width button at bottom
  - Changes based on eligibility and application status
  - Shows loading state during application

**5. My Applications Screen**:
- **Filter Tabs**: All, Pending, Accepted, Rejected, Waitlist
- **Application Cards** (in list view):
  - Company logo (left)
  - Company name and role (center)
  - Status badge (right)
  - Application date (bottom)
  - Withdraw button (if pending, bottom-right)
- **Empty State**: "You haven't applied to any drives yet" with illustration
- **Pull-to-Refresh**: Updates application statuses

**6. Profile Screen**:
- **Summary Card** (at top):
  - Student name (large, bold)
  - Registration ID, DOB, Branch, CGPA, Year, Section, Nationality (grid layout)
  - Aadhar and PAN tiles (if provided)
- **Contact & Access Card**:
  - Email, Alternate Email
  - Phone, Alternate Phone
  - Resume URL with "Open" button
- **Addresses Card**:
  - Permanent address (left column)
  - Present address (right column)
  - Shows full formatted addresses
- **Academic History Card**:
  - Degree, Intermediate, SSC sections
  - Shows course, institution, board, marks for each
- **Actions**:
  - "Edit Profile" button (full-width, primary)
  - "Logout" button (full-width, outlined)

**7. Notifications Screen**:
- **List of Notifications**:
  - Each row shows title, message, timestamp
  - Unread = bold text + blue dot
  - Read = normal text + no dot
- **Tap Action**: Opens related screen or shows detail dialog
- **Empty State**: "No notifications yet" with bell icon
- **Pull-to-Refresh**: Fetches latest notifications

**8. Settings Screen**:
- **Server Configuration Section**:
  - API Host text field (pre-filled with current IP)
  - Port display (4000, read-only)
  - "Save" button
  - Help text explaining format
- **Theme Section**:
  - Radio buttons: System, Light, Dark
  - Currently selected option highlighted
- **Profile Section**:
  - "View Profile" button → Navigates to Profile tab
- **About Section**:
  - App version number
  - Build number
  - "About" link
- **Logout Button** (at bottom, red color)

### Navigation Structure

**Bottom Navigation Bar**:
1. **Drives** (Home icon): Browse and apply to placement drives
2. **Applications** (Document icon): Track your applications
3. **Notifications** (Bell icon): See updates and announcements
4. **Profile** (Person icon): View and edit profile
5. **Settings** (Gear icon): Configure app preferences

**Badge Counts**:
- Notifications tab shows unread count
- Applications tab shows new status update count

---

## Data Flow & Architecture

### Communication Flow

```
Student App (Flutter)
      ↓
   API Calls
      ↓
Backend Server (Node.js + Express)
      ↓
   Database Queries
      ↓
Supabase PostgreSQL Database
```

**Example – Applying to a Drive**:
1. Student taps "Apply Now" on drive detail screen
2. App retrieves authentication token from secure storage
3. App sends POST request to `/api/applications` with:
   - Headers: `Authorization: Bearer <token>`
   - Body: `{ drive_id: 123 }`
4. Server validates token and extracts student ID
5. Server checks eligibility (branch, CGPA, backlogs, duplicates)
6. Server creates application record in `applications` table
7. Server creates notification for student ("Application submitted")
8. Server returns success response with application data
9. App shows success snackbar message
10. App navigates to "My Applications" tab
11. New application appears with "Pending" status

### State Management

**Provider Pattern**:
- App uses Provider for state management
- Separate providers for:
  - Authentication state (login, token, user data)
  - Drives state (list of drives, filters, search)
  - Applications state (list of applications, statuses)
  - Notifications state (list of notifications, unread count)
  - Theme state (current theme mode)

**Local Storage**:
- Secure Storage (encrypted):
  - Authentication token
  - User ID
- Shared Preferences (key-value):
  - Theme preference
  - Server IP address
  - Last login Registration ID (for convenience)
  - Cached profile data (for offline viewing)

### Offline Support

**What Works Offline**:
- View previously loaded profile data
- View cached drive listings
- View cached application statuses
- Read old notifications
- Navigate between screens

**What Requires Network**:
- Login and registration
- Applying to drives
- Updating profile
- Fetching new drives
- Refreshing application statuses
- Receiving new notifications

**Graceful Degradation**:
- Network errors show friendly messages
- Retry buttons appear for failed actions
- Cached data shown with "Offline" indicator
- Pull-to-refresh available to retry fetching

---

## Security & Privacy

### Authentication & Authorization

**Token-Based Authentication**:
- JWT (JSON Web Token) issued on login
- Token stored in encrypted secure storage
- Token sent with every API request in `Authorization` header
- Token expires after 30 days for security
- Automatic logout on token expiry

**Password Security**:
- Default password is DOB in DDMMYYYY format
- Students should change password from web portal (admin feature)
- Passwords never stored in app, only on server (hashed)

### Data Protection

**Sensitive Data**:
- Identity documents (Aadhar, PAN) encrypted in transit (HTTPS)
- Authentication token encrypted at rest (Secure Storage)
- No sensitive data logged to console in production build

**Privacy**:
- Personal information only visible to student and admins
- Other students cannot see your profile or applications
- Phone and email not shared with companies directly

---

## Technology Stack & Dependencies

### Framework

**Flutter (Dart)**:
- Version: Latest stable (3.x)
- Cross-platform capability (built for Android, can deploy to iOS)
- Native performance (compiled to ARM code)
- Hot reload for fast development

### Key Dependencies

**Network & API**:
- `http`: REST API communication with backend
- `provider`: State management across app
- `shared_preferences`: Local key-value storage

**UI & Design**:
- `google_fonts`: Inter font family for professional typography
- `cached_network_image`: Image caching for company logos
- `flutter_svg`: SVG image support

**Security**:
- `flutter_secure_storage`: Encrypted storage for authentication token
- HTTPS enforced for all API calls

**Utilities**:
- `intl`: Date/time formatting and internationalization
- `url_launcher`: Open URLs (resume links) in browser

### Platform Specifications

**Android**:
- Minimum SDK: Android 6.0 (API Level 23)
- Target SDK: Android 13+ (API Level 33)
- Supports Android 6.0 through Android 14+

**Build Outputs**:
- APK file for distribution
- App Bundle (AAB) for Google Play Store (future)

---

## How Students Use It (Real-World Scenarios)

### Complete User Journey

**Day 1 – Setup**:
1. Student receives APK file from placement cell
2. Installs app on Android phone
3. Opens app and registers with Registration ID
4. Completes multi-step registration form (10-15 minutes)
5. Sets server IP if using local network
6. Browses available drives

**Week 1 – Active Application Period**:
- **Monday Morning**: Opens app, sees 3 new drives posted over weekend
- **Monday Lunch**: Reads drive descriptions, checks eligibility
- **Monday Afternoon**: Applies to 2 eligible drives
- **Tuesday**: Receives notification "Application Submitted Successfully"
- **Friday**: Checks applications tab, still showing "Pending" status

**Week 2 – Shortlisting**:
- **Monday**: Receives notification "Your application to XYZ Corp has been Accepted!"
- **Monday Evening**: Opens app, sees green "Accepted" badge on application
- **Tuesday**: Prepares for interview round
- **Wednesday**: Other application shows "Rejected" – views and withdraws

**Week 3 – Continuous Applications**:
- **Regular Check-ins**: Opens app daily to check for new drives
- **Profile Updates**: Updates CGPA after semester results
- **Networking**: Shares drive details with classmates

### Daily Usage Patterns

**Morning Routine** (7-8 AM):
1. Open app from home screen
2. Check notification badge
3. Tap notifications tab to see any new updates
4. Browse drives for new postings
5. Read drive details for interesting companies

**Lunch Break** (12-1 PM):
1. Decide on which drives to apply
2. Verify eligibility and deadline
3. Submit applications
4. Receive confirmation messages

**Evening Check** (6-7 PM):
1. Open "My Applications" tab
2. Check if any status changed from "Pending"
3. Mark notifications as read

**Weekly Maintenance**:
- **Monday**: Update CGPA if semester results out
- **Friday**: Review applied drives and plan for next week

---

## Key Features Summary

### Core Capabilities

1. **Complete Profile Management**
   - Multi-step registration with validation
   - Profile editing with real-time updates
   - Identity document support (Aadhar, PAN)
   - Education history tracking

2. **Drive Discovery & Application**
   - Real-time eligibility checking
   - Search and filter functionality
   - One-tap application process
   - Application withdrawal option

3. **Application Tracking**
   - Color-coded status visualization
   - Status update notifications
   - Application history
   - Filter by status

4. **Notification System**
   - Real-time push notifications (optional)
   - In-app notification center
   - Badge counts for unread items
   - Deep linking to relevant content

5. **Customization**
   - Theme selection (Light/Dark/System)
   - Server configuration
   - Flexible settings

### User Experience Highlights

**Performance**:
- Fast startup time (<2 seconds)
- Smooth scrolling (60fps animations)
- Lazy loading for long lists
- Image caching for instant load

**Accessibility**:
- High contrast mode support
- Large touch targets (min 48x48dp)
- Screen reader compatible
- Readable font sizes (min 14sp)

**Reliability**:
- Graceful error handling
- Automatic retry for failed requests
- Offline data caching
- Clear error messages

**Visual Feedback**:
- Loading states for all actions
- Success/error snackbars
- Pull-to-refresh indicators
- Button press animations

---

## Summary

The Flutter mobile app provides students with a **comprehensive, intuitive platform** to manage their entire placement journey from start to finish. From initial registration with detailed profile information (including identity documents) to browsing placement drives, submitting applications, and tracking status updates in real-time, students have complete control and visibility.

The app seamlessly integrates with the backend server using secure REST APIs, ensuring data synchronization while maintaining a smooth, responsive user experience. With features like real-time eligibility checking, color-coded status tracking, push notifications, and offline support, students stay informed and organized throughout the placement process.

The modern Material Design 3 interface, combined with smooth animations and intuitive navigation, creates a professional and enjoyable user experience that makes the placement process less stressful and more manageable for students.
