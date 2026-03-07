const CLIENT_ID = "1056707372867-8fcmbacro7rn36o3ntjcr2bt6uf5ooj7.apps.googleusercontent.com"

const FAMILY_CALENDAR = "family02518920920168070169@group.calendar.google.com"

const SCOPES = "https://www.googleapis.com/auth/calendar"

let tokenClient
let accessToken = null

const loginView = document.getElementById("loginView")
const formView = document.getElementById("formView")

const loginBtn = document.getElementById("loginBtn")
const addBtn = document.getElementById("addBtn")

const titleInput = document.getElementById("title")

const daySelect = document.getElementById("day")
const monthSelect = document.getElementById("month")
const hourSelect = document.getElementById("hour")
const minuteSelect = document.getElementById("minute")

const durDays = document.getElementById("durDays")
const durHours = document.getElementById("durHours")
const durMinutes = document.getElementById("durMinutes")

const dialog = document.getElementById("dialog")
const nextBtn = document.getElementById("nextBtn")

function speak(text){

const live=document.createElement("div")

live.setAttribute("aria-live","assertive")

live.style.position="absolute"
live.style.left="-9999px"

live.textContent=text

document.body.appendChild(live)

setTimeout(()=>{
document.body.removeChild(live)
},2000)

}

function focusForm(){

titleInput.focus()

setTimeout(()=>{
titleInput.focus()
},200)

}

function initGoogle(){

tokenClient = google.accounts.oauth2.initTokenClient({

client_id: CLIENT_ID,

scope: SCOPES,

callback: (tokenResponse)=>{

accessToken = tokenResponse.access_token

sessionStorage.setItem("calendar_token", accessToken)

loginView.classList.add("hidden")
formView.classList.remove("hidden")

focusForm()

}

})

}

loginBtn.onclick = ()=>{
tokenClient.requestAccessToken()
}

function populateTime(){

for(let h=0;h<24;h++){

let opt=document.createElement("option")
opt.value=h
opt.text=h.toString().padStart(2,"0")

hourSelect.appendChild(opt)

}

for(let m=0;m<60;m+=5){

let opt=document.createElement("option")

opt.value=m
opt.text=m.toString().padStart(2,"0")

minuteSelect.appendChild(opt)

}

}

function populateDuration(){

for(let d=0;d<=30;d++){

let opt=document.createElement("option")
opt.value=d
opt.text=d

durDays.appendChild(opt)

}

for(let h=0;h<24;h++){

let opt=document.createElement("option")
opt.value=h
opt.text=h

durHours.appendChild(opt)

}

for(let m=0;m<60;m+=5){

let opt=document.createElement("option")
opt.value=m
opt.text=m

durMinutes.appendChild(opt)

}

}

function populateDate(){

const today=new Date()

const currentMonth=today.getMonth()+1
const currentDay=today.getDate()

for(let m=currentMonth;m<=12;m++){

let opt=document.createElement("option")

opt.value=m
opt.text=m

monthSelect.appendChild(opt)

}

updateDays()

}

function updateDays(){

daySelect.innerHTML=""

const today=new Date()

const selectedMonth=parseInt(monthSelect.value)

const currentMonth=today.getMonth()+1
const currentDay=today.getDate()

const daysInMonth=new Date(today.getFullYear(),selectedMonth,0).getDate()

let startDay=1

if(selectedMonth===currentMonth){
startDay=currentDay
}

for(let d=startDay;d<=daysInMonth;d++){

let opt=document.createElement("option")

opt.value=d
opt.text=d

daySelect.appendChild(opt)

}

}

monthSelect.onchange=updateDays

addBtn.onclick = async ()=>{

const title=titleInput.value

const day=parseInt(daySelect.value)
const month=parseInt(monthSelect.value)
const hour=parseInt(hourSelect.value)
const minute=parseInt(minuteSelect.value)

const durationDays=parseInt(durDays.value)
const durationHours=parseInt(durHours.value)
const durationMinutes=parseInt(durMinutes.value)

const year=new Date().getFullYear()

if(!title){
alert("Podaj nazwę wydarzenia")
return
}

const start=new Date(year,month-1,day,hour,minute)

const end=new Date(start)

end.setDate(end.getDate()+durationDays)
end.setHours(end.getHours()+durationHours)
end.setMinutes(end.getMinutes()+durationMinutes)

const startISO=start.toISOString()
const endISO=end.toISOString()

const event={

summary:title,

start:{
dateTime:startISO,
timeZone:"Europe/Warsaw"
},

end:{
dateTime:endISO,
timeZone:"Europe/Warsaw"
}

}

const response=await fetch(

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

formView.classList.add("hidden")
dialog.classList.remove("hidden")

speak("Wydarzenie utworzone")

titleInput.value=""

}else{

const errorText = await response.text()

alert("Błąd zapisu: "+errorText)

}

}

nextBtn.onclick=()=>{

dialog.classList.add("hidden")
formView.classList.remove("hidden")

focusForm()

}

window.onload = ()=>{

populateDate()
populateTime()
populateDuration()

initGoogle()

const savedToken=sessionStorage.getItem("calendar_token")

if(savedToken){

accessToken=savedToken

loginView.classList.add("hidden")
formView.classList.remove("hidden")

focusForm()

}

}
