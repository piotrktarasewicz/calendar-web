const CLIENT_ID = "1056707372867-8fcmbacro7rn36o3ntjcr2bt6uf5ooj7.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

let accessToken = null;

const loginBtn = document.getElementById("loginBtn");
const loginView = document.getElementById("loginView");
const searchView = document.getElementById("searchView");
const resultView = document.getElementById("resultView");

const monthSelect = document.getElementById("monthSelect");
const daySelect = document.getElementById("daySelect");
const showBtn = document.getElementById("showBtn");
const backBtn = document.getElementById("backBtn");
const eventsDiv = document.getElementById("events");

const today = new Date();

function initMonths() {
  for (let i = today.getMonth(); i < 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = new Date(0, i).toLocaleString("pl-PL", { month: "long" });
    monthSelect.appendChild(option);
  }
  updateDays();
}

function updateDays() {
  daySelect.innerHTML = "";
  const selectedMonth = parseInt(monthSelect.value);
  const year = today.getFullYear();
  const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();

  const startDay = selectedMonth === today.getMonth() ? today.getDate() : 1;

  for (let d = startDay; d <= daysInMonth; d++) {
    const option = document.createElement("option");
    option.value = d;
    option.text = d;
    daySelect.appendChild(option);
  }
}

monthSelect.addEventListener("change", updateDays);

loginBtn.addEventListener("click", () => {
  google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      loginView.classList.add("hidden");
      searchView.classList.remove("hidden");
    },
  }).requestAccessToken();
});

async function fetchAllCalendars() {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await response.json();
  return data.items || [];
}

async function fetchEvents(calendarId, start, end) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await response.json();
  return data.items || [];
}

showBtn.addEventListener("click", async () => {
  const year = today.getFullYear();
  const month = parseInt(monthSelect.value);
  const day = parseInt(daySelect.value);

  const start = new Date(year, month, day, 0, 0, 0).toISOString();
  const end = new Date(year, month, day, 23, 59, 59).toISOString();

  eventsDiv.innerHTML = "<p>Ładowanie...</p>";

  const calendars = await fetchAllCalendars();
  let allEvents = [];

  for (const cal of calendars) {
    const events = await fetchEvents(cal.id, start, end);
    allEvents = allEvents.concat(events);
  }

  eventsDiv.innerHTML = "";

  if (allEvents.length === 0) {
    eventsDiv.innerHTML = "<p>Brak wydarzeń</p>";
  } else {
    allEvents.sort((a, b) => {
      const aTime = a.start.dateTime || a.start.date || "";
      const bTime = b.start.dateTime || b.start.date || "";
      return aTime.localeCompare(bTime);
    });

    allEvents.forEach(event => {
      const div = document.createElement("div");

      const time = event.start.dateTime
        ? new Date(event.start.dateTime).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
        : "Cały dzień";

      div.innerHTML = `<p>${time} — ${event.summary || "(bez tytułu)"}</p>`;
      eventsDiv.appendChild(div);
    });
  }

  searchView.classList.add("hidden");
  resultView.classList.remove("hidden");
});

backBtn.addEventListener("click", () => {
  resultView.classList.add("hidden");
  searchView.classList.remove("hidden");
});

initMonths();
