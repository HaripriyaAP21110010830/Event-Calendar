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

function Calendar({ currentDate, onDateClick, events, onEventClick, onDragStart, onDragOver, onDrop }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, "d");
      const cloneDay = day;

      // Get events for this day, including recurrence
      const dayEvents = events.filter((ev) => {
        if (ev.date === format(cloneDay, "yyyy-MM-dd")) return true;
        if (ev.recurrence === "daily") return cloneDay >= parseISO(ev.date);
        if (ev.recurrence === "weekly") {
          const startDay = parseISO(ev.date);
          return cloneDay >= startDay && cloneDay.getDay() === startDay.getDay();
        }
        if (ev.recurrence === "monthly") {
          const startDay = parseISO(ev.date);
          return cloneDay >= startDay && cloneDay.getDate() === startDay.getDate();
        }
        return false;
      });

      days.push(
        <td
          key={cloneDay}
          className={`cell ${
            !isSameMonth(cloneDay, monthStart) ? "disabled" : ""
          } ${isSameDay(cloneDay, new Date()) ? "today" : ""}`}
          onClick={() => onDateClick(cloneDay)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, cloneDay)}
          style={{ verticalAlign: "top", padding: 5, border: "1px solid #ddd", height: 110, width: 120 }}
        >
          <div style={{ fontWeight: "bold" }}>{formattedDate}</div>
          {dayEvents.map((ev) => (
            <div
              key={ev.id}
              draggable
              onDragStart={(e) => onDragStart(e, ev.id)}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(ev);
              }}
              style={{
                backgroundColor: "#4f46e5",
                color: "white",
                marginTop: 2,
                padding: "2px 4px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
              title={`${ev.title} @ ${ev.time}`}
            >
              {ev.title} ({ev.time})
            </div>
          ))}
        </td>
      );
      day = addDays(day, 1);
    }
    rows.push(<tr key={day}>{days}</tr>);
    days = [];
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <th key={d} style={{ borderBottom: "2px solid #444", padding: 8 }}>
              {d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

export default function App() {
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
    recurrence: "none",
  });
  const [filterText, setFilterText] = useState("");
  const [draggedEventId, setDraggedEventId] = useState(null);

  // Persist events to localStorage
  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  // Filtered events
  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(filterText.toLowerCase())
  );

  // Auto jump calendar to month of first matching event
  useEffect(() => {
    if (filterText.trim() === "") return;
    if (filteredEvents.length === 0) return;
    const firstDate = parseISO(filteredEvents[0].date);
    setCurrentMonth(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
  }, [filterText]);

  // Check conflicts
  function hasConflict(dateStr, timeStr, excludeId = null) {
    return events.some((ev) => {
      if (excludeId && ev.id === excludeId) return false;
      return ev.date === dateStr && ev.time === timeStr;
    });
  }

  // Handlers
  function onDayClick(day) {
    setSelectedDate(day);
    setFormData({
      id: null,
      title: "",
      date: format(day, "yyyy-MM-dd"),
      time: "12:00",
      description: "",
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

  // Drag and drop handlers
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

  return (
    <div className="calendar">
      <h1>Custom Event Calendar</h1>

      {/* Month navigation */}
      <div className="header">
        <div className="col col-start">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            Prev
          </button>
        </div>
        <div className="col col-center">
          <h2>{format(currentMonth, "MMMM yyyy")}</h2>
        </div>
        <div className="col col-end">
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            Next
          </button>
        </div>
      </div>

      {/* Search/filter */}
      <input
        type="text"
        placeholder="Search events by title..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10, fontSize: 16 }}
      />

      {/* Calendar */}
      <Calendar
        currentDate={currentMonth}
        onDateClick={onDayClick}
        events={filteredEvents}
        onEventClick={onEventClick}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      />

      {/* Event form modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 400 }}
          >
            <h3>{formData.id ? "Edit Event" : "Add Event"}</h3>
            <form onSubmit={onFormSubmit}>
              <label>
                Title
                <input
                  name="title"
                  value={formData.title}
                  onChange={onFormChange}
                  required
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={onFormChange}
                  required
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={onFormChange}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={onFormChange}
                />
              </label>
              <label>
                Recurrence
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

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button type="submit" style={{ flex: 1, marginRight: 5 }}>
                  Save
                </button>
                {formData.id && (
                  <button
                    type="button"
                    style={{ flex: 1, marginLeft: 5, backgroundColor: "#dc2626", color: "white" }}
                    onClick={() => onDeleteEvent(formData.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
            <button
              onClick={() => setShowForm(false)}
              style={{ marginTop: 10, width: "100%" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        .calendar {
          max-width: 900px;
          margin: 20px auto;
          font-family: Arial, sans-serif;
          user-select: none;
        }
        .header {
          display: flex;
          margin-bottom: 10px;
          align-items: center;
          justify-content: space-between;
        }
        button {
          background-color: #4f46e5;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover {
          background-color: #4338ca;
        }
        .cell.disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
        }
        .cell.today {
          border: 2px solid #4f46e5;
        }
        .modal-backdrop {
          position: fixed;
          top:0; left:0; right:0; bottom:0;
          background: rgba(0,0,0,0.5);
          display:flex;
          justify-content:center;
          align-items:center;
          z-index: 1000;
        }
        .modal {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 0.9rem;
        }
        input[type="text"],
        input[type="date"],
        input[type="time"],
        select,
        textarea {
          width: 100%;
          padding: 6px 8px;
          margin-top: 4px;
          margin-bottom: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
        }
        textarea {
          resize: vertical;
          min-height: 60px;
        }
      `}</style>
    </div>
  );
}
