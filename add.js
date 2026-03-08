const CLIENT_ID = "1056707372867-8fcmbacro7rn36o3ntjcr2bt6uf5ooj7.apps.googleusercontent.com";

/*
  Wpisz tutaj prawdziwe ID kalendarza Google, na przykład:
  family02518920920168070169@group.calendar.google.com

  Bez:
  - nawiasów
  - mailto:
  - markdown
*/
const FAMILY_CALENDAR = "family02518920920168070169@group.calendar.google.com";

const SCOPES = "https://www.googleapis.com/auth/calendar";
const TIME_ZONE = "Europe/Warsaw";
const TOKEN_STORAGE_KEY = "calendar_token";
const LOCATION_STORAGE_KEY = "last_location";

let tokenClient = null;
let accessToken = null;
let lastFocusedElement = null;
let googleInitStarted = false;

const loginView = document.getElementById("loginView");
const formView = document.getElementById("formView");
const loginBtn = document.getElementById("loginBtn");
const eventForm = document.getElementById("eventForm");
const addBtn = document.getElementById("addBtn");

const titleInput = document.getElementById("title");
const locationInput = document.getElementById("location");

const yearSelect = document.getElementById("year");
const monthSelect = document.getElementById("month");
const daySelect = document.getElementById("day");

const allDayCheckbox = document.getElementById("allDay");
const timeBlock = document.getElementById("timeBlock");
const hourSelect = document.getElementById("hour");
const minuteSelect = document.getElementById("minute");

const durDaysSelect = document.getElementById("durDays");
const durHoursSelect = document.getElementById("durHours");
const durMinutesSelect = document.getElementById("durMinutes");

const srStatus = document.getElementById("srStatus");
const formStatus = document.getElementById("formStatus");

const successDialog = document.getElementById("successDialog");
const successText = document.getElementById("successText");
const successOkBtn = document.getElementById("successOkBtn");

const errorDialog = document.getElementById("errorDialog");
const errorText = document.getElementById("errorText");
const errorOkBtn = document.getElementById("errorOkBtn");

function announce(message) {
  if (!srStatus) {
    return;
  }

  srStatus.textContent = "";

  window.setTimeout(() => {
    srStatus.textContent = message;
  }, 30);
}

function showFormStatus(message) {
  if (!formStatus) {
    return;
  }

  formStatus.textContent = message;
  formStatus.classList.remove("hidden");
}

function clearFormStatus() {
  if (!formStatus) {
    return;
  }

  formStatus.textContent = "";
  formStatus.classList.add("hidden");
}

function showViewAfterLogin() {
  loginView.classList.add("hidden");
  formView.classList.remove("hidden");
  focusTitle();
}

function focusTitle() {
  window.setTimeout(() => {
    titleInput.focus();
  }, 0);
}

function rememberLastFocus() {
  lastFocusedElement = document.activeElement;
}

function restoreLastFocus() {
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    window.setTimeout(() => {
      lastFocusedElement.focus();
    }, 0);
    return;
  }

  focusTitle();
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toLocalDateTimeString(date) {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = "00";

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function populateYears() {
  const now = new Date();
  const currentYear = now.getFullYear();

  yearSelect.innerHTML = "";

  for (let year = currentYear; year <= currentYear + 2; year += 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  }
}

function populateMonths() {
  monthSelect.innerHTML = "";

  for (let month = 1; month <= 12; month += 1) {
    const option = document.createElement("option");
    option.value = String(month);
    option.textContent = String(month);
    monthSelect.appendChild(option);
  }
}

function populateDays() {
  const selectedYear = Number(yearSelect.value);
  const selectedMonth = Number(monthSelect.value);
  const today = new Date();

  const previousValue = daySelect.value;
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  daySelect.innerHTML = "";

  let firstAvailableDay = 1;

  if (
    selectedYear === today.getFullYear() &&
    selectedMonth === today.getMonth() + 1
  ) {
    firstAvailableDay = today.getDate();
  }

  for (let day = firstAvailableDay; day <= daysInMonth; day += 1) {
    const option = document.createElement("option");
    option.value = String(day);
    option.textContent = String(day);
    daySelect.appendChild(option);
  }

  if (
    previousValue &&
    [...daySelect.options].some((option) => option.value === previousValue)
  ) {
    daySelect.value = previousValue;
  }
}

function syncDateSelectorsWithToday() {
  const now = new Date();

  yearSelect.value = String(now.getFullYear());
  monthSelect.value = String(now.getMonth() + 1);
  populateDays();
  daySelect.value = String(now.getDate());
}

function populateTime() {
  hourSelect.innerHTML = "";
  minuteSelect.innerHTML = "";

  for (let hour = 0; hour < 24; hour += 1) {
    const option = document.createElement("option");
    option.value = String(hour);
    option.textContent = pad2(hour);
    hourSelect.appendChild(option);
  }

  for (let minute = 0; minute < 60; minute += 5) {
    const option = document.createElement("option");
    option.value = String(minute);
    option.textContent = pad2(minute);
    minuteSelect.appendChild(option);
  }
}

function populateDuration() {
  durDaysSelect.innerHTML = "";
  durHoursSelect.innerHTML = "";
  durMinutesSelect.innerHTML = "";

  for (let day = 0; day <= 30; day += 1) {
    const option = document.createElement("option");
    option.value = String(day);
    option.textContent = String(day);
    durDaysSelect.appendChild(option);
  }

  for (let hour = 0; hour <= 23; hour += 1) {
    const option = document.createElement("option");
    option.value = String(hour);
    option.textContent = String(hour);
    durHoursSelect.appendChild(option);
  }

  for (let minute = 0; minute < 60; minute += 5) {
    const option = document.createElement("option");
    option.value = String(minute);
    option.textContent = String(minute);
    durMinutesSelect.appendChild(option);
  }
}

function setCurrentTimeRoundedToFiveMinutes() {
  const now = new Date();
  const rounded = new Date(now.getTime());

  rounded.setSeconds(0, 0);

  const minute = rounded.getMinutes();
  const roundedMinutes = Math.ceil(minute / 5) * 5;

  if (roundedMinutes === 60) {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  } else {
    rounded.setMinutes(roundedMinutes, 0, 0);
  }

  hourSelect.value = String(rounded.getHours() % 24);
  minuteSelect.value = String(rounded.getMinutes());
}

function toggleTimeBlock() {
  const isAllDay = allDayCheckbox.checked;

  timeBlock.classList.toggle("hidden", isAllDay);
  durHoursSelect.disabled = isAllDay;
  durMinutesSelect.disabled = isAllDay;
}

function showSuccessDialog(message) {
  rememberLastFocus();
  successText.textContent = message;
  successDialog.showModal();
  successOkBtn.focus();
  announce(message);
}

function showErrorDialog(message) {
  rememberLastFocus();
  errorText.textContent = message;
  errorDialog.showModal();
  errorOkBtn.focus();
  announce(message);
}

function closeSuccessDialog() {
  successDialog.close();
  restoreLastFocus();
}

function closeErrorDialog() {
  errorDialog.close();
  restoreLastFocus();
}

function validateForm(data) {
  const title = data.title.trim();

  if (!title) {
    return "Podaj nazwę wydarzenia.";
  }

  if (
    !FAMILY_CALENDAR ||
    FAMILY_CALENDAR.includes("mailto:") ||
    FAMILY_CALENDAR.includes("[") ||
    FAMILY_CALENDAR.includes("]")
  ) {
    return "Nieprawidłowy identyfikator kalendarza w pliku add.js. Wpisz czyste ID kalendarza Google.";
  }

  if (!data.allDay) {
    const totalMinutes =
      data.durationDays * 24 * 60 +
      data.durationHours * 60 +
      data.durationMinutes;

    if (totalMinutes <= 0) {
      return "Dla wydarzenia o konkretnej godzinie czas trwania musi być większy od zera.";
    }
  }

  return "";
}

function getFormData() {
  return {
    title: titleInput.value,
    location: locationInput.value.trim(),
    year: Number(yearSelect.value),
    month: Number(monthSelect.value),
    day: Number(daySelect.value),
    allDay: allDayCheckbox.checked,
    hour: Number(hourSelect.value),
    minute: Number(minuteSelect.value),
    durationDays: Number(durDaysSelect.value),
    durationHours: Number(durHoursSelect.value),
    durationMinutes: Number(durMinutesSelect.value),
  };
}

function buildEventPayload(data) {
  const event = {
    summary: data.title.trim(),
  };

  if (data.location) {
    event.location = data.location;
  }

  if (data.allDay) {
    const startDate = new Date(data.year, data.month - 1, data.day);
    const endDate = new Date(startDate);

    endDate.setDate(endDate.getDate() + data.durationDays + 1);

    event.start = {
      date: `${startDate.getFullYear()}-${pad2(startDate.getMonth() + 1)}-${pad2(startDate.getDate())}`,
    };

    event.end = {
      date: `${endDate.getFullYear()}-${pad2(endDate.getMonth() + 1)}-${pad2(endDate.getDate())}`,
    };

    return event;
  }

  const start = new Date(
    data.year,
    data.month - 1,
    data.day,
    data.hour,
    data.minute,
    0,
    0
  );

  const end = new Date(start.getTime());
  end.setDate(end.getDate() + data.durationDays);
  end.setHours(end.getHours() + data.durationHours);
  end.setMinutes(end.getMinutes() + data.durationMinutes);

  event.start = {
    dateTime: toLocalDateTimeString(start),
    timeZone: TIME_ZONE,
  };

  event.end = {
    dateTime: toLocalDateTimeString(end),
    timeZone: TIME_ZONE,
  };

  return event;
}

function initGoogle() {
  if (tokenClient || googleInitStarted) {
    return;
  }

  if (!window.google || !google.accounts || !google.accounts.oauth2) {
    return;
  }

  googleInitStarted = true;

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      if (!tokenResponse || !tokenResponse.access_token) {
        showErrorDialog("Logowanie do Google nie powiodło się.");
        return;
      }

      accessToken = tokenResponse.access_token;
      sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      showViewAfterLogin();
      announce("Zalogowano do Google. Formularz dodawania wydarzeń jest dostępny.");
    },
    error_callback: (error) => {
      let message = "Nie udało się rozpocząć logowania Google.";

      if (error && error.type) {
        if (error.type === "popup_failed_to_open") {
          message = "Nie udało się otworzyć okna logowania Google. Sprawdź, czy przeglądarka nie blokuje wyskakujących okien.";
        } else if (error.type === "popup_closed") {
          message = "Okno logowania Google zostało zamknięte przed zakończeniem logowania.";
        } else {
          message = `Błąd logowania Google: ${error.type}.`;
        }
      }

      showErrorDialog(message);
    },
  });
}

function waitForGoogleAndInit(attempt = 0) {
  initGoogle();

  if (tokenClient) {
    return;
  }

  if (attempt >= 40) {
    showErrorDialog("Nie udało się załadować modułu logowania Google. Odśwież stronę i spróbuj ponownie.");
    return;
  }

  window.setTimeout(() => {
    waitForGoogleAndInit(attempt + 1);
  }, 250);
}

async function addEvent() {
  clearFormStatus();

  if (!accessToken) {
    showErrorDialog("Najpierw zaloguj się do Google.");
    return;
  }

  const data = getFormData();
  const validationError = validateForm(data);

  if (validationError) {
    showErrorDialog(validationError);
    return;
  }

  const payload = buildEventPayload(data);

  addBtn.disabled = true;
  addBtn.textContent = "Dodawanie wydarzenia...";
  showFormStatus("Trwa dodawanie wydarzenia do kalendarza.");

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(FAMILY_CALENDAR)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      let message = "Nieznany błąd zapisu.";

      try {
        const errorData = await response.json();

        if (errorData && errorData.error && errorData.error.message) {
          message = errorData.error.message;
        } else {
          message = await response.text();
        }
      } catch {
        try {
          message = await response.text();
        } catch {
          message = "Nie udało się odczytać informacji o błędzie.";
        }
      }

      showErrorDialog(`Błąd zapisu: ${message}`);
      return;
    }

    if (data.location) {
      localStorage.setItem(LOCATION_STORAGE_KEY, data.location);
    } else {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    }

    eventForm.reset();
    syncDateSelectorsWithToday();
    populateDays();
    setCurrentTimeRoundedToFiveMinutes();
    toggleTimeBlock();

    showSuccessDialog("Wydarzenie zostało poprawnie dodane do kalendarza.");
  } catch (error) {
    const message =
      error && error.message
        ? error.message
        : "Wystąpił problem z połączeniem lub przetwarzaniem żądania.";

    showErrorDialog(`Nie udało się dodać wydarzenia. ${message}`);
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "Dodaj wydarzenie";
    clearFormStatus();
  }
}

function restoreSession() {
  const savedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);

  if (savedToken) {
    accessToken = savedToken;
    showViewAfterLogin();
  }

  const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);

  if (savedLocation) {
    locationInput.value = savedLocation;
  }
}

function bindEvents() {
  loginBtn.addEventListener("click", () => {
    initGoogle();

    if (!tokenClient) {
      showErrorDialog("Logowanie Google nie jest jeszcze gotowe. Odśwież stronę i spróbuj ponownie.");
      return;
    }

    tokenClient.requestAccessToken();
  });

  eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await addEvent();
  });

  yearSelect.addEventListener("change", populateDays);
  monthSelect.addEventListener("change", populateDays);

  allDayCheckbox.addEventListener("change", () => {
    toggleTimeBlock();

    if (allDayCheckbox.checked) {
      announce("Wybrano wydarzenie całodniowe. Pola godziny i minuty zostały ukryte.");
    } else {
      announce("Wyłączono wydarzenie całodniowe. Pola godziny i minuty są ponownie dostępne.");
    }
  });

  successOkBtn.addEventListener("click", () => {
    closeSuccessDialog();
    focusTitle();
  });

  errorOkBtn.addEventListener("click", () => {
    closeErrorDialog();
  });

  successDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeSuccessDialog();
    focusTitle();
  });

  errorDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeErrorDialog();
  });
}

function init() {
  populateYears();
  populateMonths();
  syncDateSelectorsWithToday();
  populateTime();
  populateDuration();
  setCurrentTimeRoundedToFiveMinutes();
  toggleTimeBlock();
  restoreSession();
  bindEvents();
  waitForGoogleAndInit();
}

init();
