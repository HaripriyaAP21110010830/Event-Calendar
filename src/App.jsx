import React, { useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("calendarEvents");
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    date: "",
    time: "12:00",
    description: "",
    category: "General",
    recurrence: "none",
  });
  const [filterText, setFilterText] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [draggedEventId, setDraggedEventId] = useState(null);

  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (filterText.trim() === "") return;
    const matched = events.find((ev) =>
      ev.title.toLowerCase().includes(filterText.toLowerCase())
    );
    if (matched) {
      const evDate = parseISO(matched.date);
      setCurrentMonth(new Date(evDate.getFullYear(), evDate.getMonth(), 1));
    }
  }, [filterText, events]);

  const matchedDates =
    filterText.trim() === ""
      ? []
      : events
          .filter((ev) => ev.title.toLowerCase() === filterText.toLowerCase())
          .map((ev) => ev.date);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;

  const filteredEvents = events.filter((ev) => {
    const textMatch =
      ev.title.toLowerCase().includes(filterText.toLowerCase()) ||
      ev.description.toLowerCase().includes(filterText.toLowerCase());
    const categoryMatch =
      filterCategory === "all" || ev.category === filterCategory;
    return textMatch && categoryMatch;
  });

  function hasConflict(dateStr, timeStr, excludeId = null) {
    return events.some((ev) => {
      if (excludeId && ev.id === excludeId) return false;
      if (ev.date === dateStr && ev.time === timeStr) return true;
      const checkDate = parseISO(dateStr);
      const evStartDate = parseISO(ev.date);
      if (ev.time !== timeStr) return false;
      if (ev.recurrence === "daily" && checkDate >= evStartDate) return true;
      if (
        ev.recurrence === "weekly" &&
        checkDate >= evStartDate &&
        checkDate.getDay() === evStartDate.getDay()
      )
        return true;
      if (
        ev.recurrence === "monthly" &&
        checkDate >= evStartDate &&
        checkDate.getDate() === evStartDate.getDate()
      )
        return true;
      return false;
    });
  }

  function onDayClick(day) {
    setSelectedDate(day);
    setFormData({
      id: null,
      title: "",
      date: format(day, "yyyy-MM-dd"),
      time: "12:00",
      description: "",
      category: "General",
      recurrence: "none",
    });
    setShowForm(true);
  }

  function onEventClick(ev) {
    setSelectedDate(parseISO(ev.date));
    setFormData({ ...ev });
    setShowForm(true);
  }

  function onFormChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function onFormSubmit(e) {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time) {
      alert("Title, date and time are required");
      return;
    }
    if (hasConflict(formData.date, formData.time, formData.id)) {
      alert("Event conflict detected! Please choose another time.");
      return;
    }
    if (formData.id) {
      setEvents((prev) =>
        prev.map((ev) => (ev.id === formData.id ? formData : ev))
      );
    } else {
      setEvents((prev) => [
        ...prev,
        { ...formData, id: Date.now().toString() },
      ]);
    }
    setShowForm(false);
  }

  function onDeleteEvent(id) {
    if (window.confirm("Delete this event?")) {
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      setShowForm(false);
    }
  }

  function onDragStart(e, id) {
    setDraggedEventId(id);
  }
  function onDragOver(e) {
    e.preventDefault();
  }
  function onDrop(e, day) {
    e.preventDefault();
    if (!draggedEventId) return;
    const ev = events.find((ev) => ev.id === draggedEventId);
    if (!ev) return;
    const newDateStr = format(day, "yyyy-MM-dd");
    if (hasConflict(newDateStr, ev.time, ev.id)) {
      alert("Conflict on the target date/time!");
      return;
    }
    const updated = { ...ev, date: newDateStr };
    setEvents((prev) =>
      prev.map((e) => (e.id === draggedEventId ? updated : e))
    );
    setDraggedEventId(null);
  }

  const categories = Array.from(
    new Set(events.map((ev) => ev.category).filter(Boolean))
  );
  if (!categories.includes("General")) categories.unshift("General");

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, dateFormat);
      const cloneDay = day;

      const dayEvents = filteredEvents.filter((ev) => {
        if (ev.date === format(cloneDay, "yyyy-MM-dd")) return true;
        if (ev.recurrence === "daily") return cloneDay >= parseISO(ev.date);
        if (ev.recurrence === "weekly") {
          const startDay = parseISO(ev.date);
          return (
            cloneDay >= startDay && cloneDay.getDay() === startDay.getDay()
          );
        }
        if (ev.recurrence === "monthly") {
          const startDay = parseISO(ev.date);
          return (
            cloneDay >= startDay && cloneDay.getDate() === startDay.getDate()
          );
        }
        return false;
      });

      const formattedDayStr = format(cloneDay, "yyyy-MM-dd");
      const highlight = matchedDates.includes(formattedDayStr);

      days.push(
        <td
          key={day}
          className={`cell ${!isSameMonth(day, monthStart) ? "disabled" : ""} ${
            isSameDay(day, new Date()) ? "today" : ""
          } ${highlight ? "highlighted" : ""}`}
          onClick={() => onDayClick(cloneDay)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, cloneDay)}
          onTouchStart={(e) => {
            e.preventDefault();
            onDayClick(cloneDay);
          }}
        >
          <div className="date-number">{formattedDate}</div>
          {dayEvents.map((ev) => (
            <div
              key={ev.id}
              draggable
              onDragStart={(e) => onDragStart(e, ev.id)}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(ev);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                onEventClick(ev);
              }}
              className="event-item"
              style={{ backgroundColor: categoryColor(ev.category) }}
              title={`${ev.title} @ ${ev.time} (${ev.category})`}
            >
              {ev.title} {ev.recurrence !== "none" ? `(${ev.recurrence})` : ""}
            </div>
          ))}
        </td>
      );
      day = addDays(day, 1);
    }
    rows.push(<tr key={day}>{days}</tr>);
    days = [];
  }

  function categoryColor(category) {
    switch (category) {
      case "Work":
        return "#2563eb";
      case "Personal":
        return "#16a34a";
      case "Urgent":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  }

  return (
    <div className="calendar">
      <h1>Event Calendar</h1>

      <div className="header">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          &lt; Prev
        </button>
        <div className="month-title">{format(currentMonth, "MMMM yyyy")}</div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          Next &gt;
        </button>
        <input
          type="text"
          placeholder="Search event name..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="search-input"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="category-select"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <table className="calendar-table">
        <thead>
          <tr>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{formData.id ? "Edit Event" : "Add Event"}</h2>
            <form onSubmit={onFormSubmit}>
              <label>
                Event Title*:
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={onFormChange}
                  required
                  autoFocus
                />
              </label>
              <label>
                Date*:
                <input
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={onFormChange}
                  required
                />
              </label>
              <label>
                Time*:
                <input
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={onFormChange}
                  required
                />
              </label>
              <label>
                Category:
                <select
                  name="category"
                  value={formData.category}
                  onChange={onFormChange}
                >
                  <option>General</option>
                  <option>Work</option>
                  <option>Personal</option>
                  <option>Urgent</option>
                </select>
              </label>
              <label>
                Recurrence:
                <select
                  name="recurrence"
                  value={formData.recurrence}
                  onChange={onFormChange}
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label>
                Description:
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={onFormChange}
                  rows={3}
                />
              </label>
              <div className="form-buttons">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                {formData.id && (
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => onDeleteEvent(formData.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar {
          max-width: 100%;
          margin: 20px;
          padding: 10px;
          font-family: Arial, sans-serif;
          user-select: none;
        }
        .header {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-bottom: 12px;
        }
        .month-title {
          flex-grow: 1;
          text-align: center;
          font-weight: bold;
          font-size: 1.2rem;
        }
        .calendar-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .cell {
          vertical-align: top;
          padding: 5px;
          border: 1px solid #ccc;
          cursor: pointer;
          min-height: 80px;
          font-size: 0.9rem;
          position: relative;
        }
        .date-number {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .event-item {
          color: white;
          margin-top: 2px;
          padding: 2px 4px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          touch-action: manipulation;
        }
        button {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          touch-action: manipulation;
        }
        button:hover {
          background-color: #1d4ed8;
        }
        .search-input,
        .category-select {
          padding: 6px;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          flex: 1;
          min-width: 120px;
        }
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal {
          background: white;
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 16px;
          width: 90%;
          max-width: 320px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 0.9rem;
        }
        input,
        select,
        textarea {
          width: 100%;
          padding: 6px;
          margin-bottom: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
        }
        .form-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          justify-content: space-between;
        }
        .form-buttons button {
          flex: 1;
          min-width: 80px;
          padding: 8px;
        }
        .delete-button {
          background-color: #dc2626;
        }
        .disabled {
          color: #bbb;
          background-color: #f9f9f9;
        }
        .today {
          border: 2px solid #2563eb;
        }
        .highlighted {
          box-shadow: 0 0 8px 3px #facc15;
          background-color: #fffbcc !important;
        }
        .cell:hover {
          background-color: #e0e7ff;
        }
        textarea {
          resize: vertical;
          min-height: 60px;
        }

        @media (max-width: 600px) {
          .calendar {
            margin: 10px;
            padding: 5px;
          }
          .cell {
            padding: 3px;
            font-size: 0.75rem;
            min-height: 60px;
          }
          .event-item {
            font-size: 0.7rem;
            padding: 1px 3px;
          }
          .date-number {
            font-size: 0.8rem;
          }
          button {
            padding: 5px 8px;
            font-size: 0.9rem;
          }
          .month-title {
            font-size: 1rem;
          }
          .search-input,
          .category-select {
            font-size: 0.9rem;
            padding: 5px;
            min-width: 100px;
          }
          .modal {
            width: 95%;
            padding: 12px;
          }
          input,
          select,
          textarea {
            font-size: 0.9rem;
            padding: 5px;
          }
          th {
            font-size: 0.8rem;
            padding: 5px;
          }
        }
        @media (max-width: 400px) {
          .cell {
            min-height: 50px;
          }
          .event-item {
            font-size: 0.65rem;
          }
          .date-number {
            font-size: 0.7rem;
          }
          .header {
            flex-direction: column;
            align-items: stretch;
          }
          .search-input,
          .category-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
