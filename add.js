const CLIENT_ID = "1056707372867-8fcmbacro7rn36o3ntjcr2bt6uf5ooj7.apps.googleusercontent.com"

const FAMILY_CALENDAR = "[family02518920920168070169@group.calendar.google.com](mailto:family02518920920168070169@group.calendar.google.com)"

const SCOPES = "https://www.googleapis.com/auth/calendar.events"

let tokenClient
let accessToken = null

const loginView = document.getElementById("loginView")
const formView = document.getElementById("formView")

const loginBtn = document.getElementById("loginBtn")
const addBtn = document.getElementById("addBtn")

const titleInput = document.getElementById("title")
const dateInput = document.getElementById("date")
const timeInput = document.getElementById("time")

const status = document.getElementById("status")

function initGoogle(){

tokenClient = google.accounts.oauth2.initTokenClient({

client_id: CLIENT_ID,

scope: SCOPES,

callback: (tokenResponse)=>{

accessToken = tokenResponse.access_token

loginView.classList.add("hidden")
formView.classList.remove("hidden")

}

})

}

loginBtn.onclick = ()=>{

tokenClient.requestAccessToken()

}

addBtn.onclick = async ()=>{

const title = titleInput.value
const date = dateInput.value
const time = timeInput.value

if(!title || !date || !time){

status.innerText = "Wypełnij wszystkie pola."
return

}

const startDateTime = date+"T"+time+":00"

const endDateTime = date+"T"+time+":00"

const event = {

summary: title,

start: {
dateTime: startDateTime
},

end: {
dateTime: endDateTime
}

}

const response = await fetch(

"https://www.googleapis.com/calendar/v3/calendars/"+encodeURIComponent(FAMILY_CALENDAR)+"/events",

{

method:"POST",

headers:{
Authorization:"Bearer "+accessToken,
"Content-Type":"application/json"
},

body:JSON.stringify(event)

}

)

if(response.ok){

status.innerText = "Wydarzenie zapisane."

titleInput.value=""
dateInput.value=""
timeInput.value=""

}else{

status.innerText = "Błąd zapisu."

}

}

window.onload = ()=>{

const script = document.createElement("script")

script.src="https://accounts.google.com/gsi/client"

script.onload = initGoogle

document.body.appendChild(script)

}
