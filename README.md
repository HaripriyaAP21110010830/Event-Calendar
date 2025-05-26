# Event Calendar App
------------------------------------------------
React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

 🚀Features 
 ------------
-Monthly calendar view
-Event creation with date, time, description, and category
-Recurring event support (Daily / Weekly / Monthly)
-Drag-and-drop to reschedule events
-Real-time conflict detection
-Responsive design for mobile and desktop
-LocalStorage support for data persistence
-Visual highlights for search results and today’s date

🛠 Setup Instructions
------------------------
Clone the repository:
git clone https://github.com/yourusername/calendar-app.git
cd calendar-app

Install dependencies:
 Node.js and npm installed. Then run:
npm install

Start the application:
npm start
The app will be available at http://localhost:3000.

📂 Project Structure
bash
Copy
Edit
├── public/
│   └── index.html
├── src/
│   ├── App.jsx          # Main component
│   ├── Calendar.jsx     # Calendar rendering logic
│   ├── App.css          # Styling
│   └── index.js         # Entry point
├── package.json
└── README.md

📌Usage Instructions
--------------------
Add Event:
Click on any date cell.
Fill in the event form.
Set title, time, recurrence (optional), and description.
Save.

Edit/Delete Event:
Click on any existing event.
Modify details or click "Delete" to remove it.

Drag and Drop:
Drag any event and drop it on another date cell to move it.

Filter/Search:
Use the input field to search events by title or description.
Use the dropdown to filter by category.

Recurring Events:
Daily: Appears every day from the start date.
Weekly: Appears weekly on the same day of the week.
Monthly: Appears monthly on the same date.


 Notes
 -------
Data is stored in browser localStorage. Refreshing won't delete your events.
Events with identical date & time will raise a conflict warning.
Designed to be responsive and mobile-friendly.

🧰Technologies Used
------------------------
React Components:
App.jsx handles overall logic, state management, and renders UI.
Calendar.jsx displays the monthly calendar and individual date cells.

State Management:
useState, useEffect hooks are used to manage selected date, events, filters, form data, and more.

Event Conflict Detection:
Checks if an event overlaps with another at the same time and date before allowing submission or drag/drop.

Responsive UI:
CSS media queries and flexbox/grid layouts are used to ensure usability on all screen sizes.

Filtering & Searching:
Filters events by title and category dynamically using controlled input elements.

Recurring Events Logic:
Uses date-fns and conditional logic to render repeating events based on recurrence type (daily, weekly, monthly).
