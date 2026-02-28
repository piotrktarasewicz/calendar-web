const CLIENT_ID = "1056707372867-8fcmbacro7rn36o3ntjcr2bt6uf5ooj7.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

let accessToken = sessionStorage.getItem("accessToken");
let tokenClient;

const today = new Date();

/* ---------- LOGOWANIE ---------- */

function initGoogleClient() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.access_token) {
        accessToken = response.access_token;
        sessionStorage.setItem("accessToken", accessToken);
        showSearch();
      }
    }
  });
}

function showSearch() {
  const loginSection = document.getElementById("loginSection");
  const searchSection = document.getElementById("searchSection");
  if (loginSection && searchSection) {
    loginSection.style.display = "none";
    searchSection.style.display = "block";
  }
}

function setupLogin() {
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;

  if (accessToken) {
    showSearch();
  }

  loginBtn.addEventListener("click", () => {
    tokenClient.requestAccessToken();
  });
}

/* ---------- WYBÓR DATY ---------- */

function initDateSelectors() {
  const monthSelect = document.getElementById("monthSelect");
  const daySelect = document.getElementById("daySelect");
  const showBtn = document.getElementById("showBtn");

  if (!monthSelect || !daySelect) return;

  for (let i = today.getMonth(); i < 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = new Date(0, i).toLocaleString("pl-PL", { month: "long" });
    monthSelect.appendChild(option);
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
  updateDays();

  showBtn.addEventListener("click", () => {
    const selectedDate = {
      year: today.getFullYear(),
      month: parseInt(monthSelect.value),
      day: parseInt(daySelect.value)
    };

    sessionStorage.setItem("selectedDate", JSON.stringify(selectedDate));
    window.location.href = "results.html";
  });
}

/* ---------- WYNIKI ---------- */

async function fetchAllCalendars() {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return (await response.json()).items || [];
}

async function fetchEvents(calendarId, start, end) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return (await response.json()).items || [];
}

async function loadResults() {
  const eventsDiv = document.getElementById("events");
  const header = document.getElementById("dateHeader");
  if (!eventsDiv) return;

  const storedDate = sessionStorage.getItem("selectedDate");
  if (!storedDate || !accessToken) {
    window.location.href = "index.html";
    return;
  }

  const { year, month, day } = JSON.parse(storedDate);

  const dateObj = new Date(year, month, day);
  header.textContent = dateObj.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const start = new Date(year, month, day, 0, 0, 0).toISOString();
  const end = new Date(year, month, day, 23, 59, 59).toISOString();

  eventsDiv.textContent = "Ładowanie...";

  try {
    const calendars = await fetchAllCalendars();
    let allEvents = [];

    for (const cal of calendars) {
      const events = await fetchEvents(cal.id, start, end);
      allEvents = allEvents.concat(events);
    }

    if (allEvents.length === 0) {
      eventsDiv.textContent = "Brak wydarzeń";
      return;
    }

    allEvents.sort((a, b) => {
      const aTime = a.start.dateTime || a.start.date || "";
      const bTime = b.start.dateTime || b.start.date || "";
      return aTime.localeCompare(bTime);
    });

    const now = new Date();
    eventsDiv.innerHTML = "";

    allEvents.forEach(event => {
      const div = document.createElement("div");

      if (event.start.dateTime && event.end.dateTime) {
        const startTime = new Date(event.start.dateTime);
        const endTime = new Date(event.end.dateTime);

        const isToday =
          startTime.getFullYear() === now.getFullYear() &&
          startTime.getMonth() === now.getMonth() &&
          startTime.getDate() === now.getDate();

        if (isToday && now >= startTime && now <= endTime) {
          div.textContent = `Trwa do ${endTime.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })} — ${event.summary || "(bez tytułu)"}`;
        } else {
          div.textContent = `${startTime.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })} — ${event.summary || "(bez tytułu)"}`;
        }
      } else {
        div.textContent = `Cały dzień — ${event.summary || "(bez tytułu)"}`;
      }

      eventsDiv.appendChild(div);
    });

  } catch (e) {
    sessionStorage.clear();
    window.location.href = "index.html";
  }
}

function goBack() {
  window.location.href = "index.html";
}

/* ---------- START ---------- */

window.onload = () => {
  initGoogleClient();
  setupLogin();
  initDateSelectors();
  loadResults();
};
