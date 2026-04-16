"use client";

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { db } from "../firebase"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import AOS from "aos"
import "aos/dist/aos.css"


function Divider(){
  return(
    <div
      style={{
        width:"120px",
        height:"1px",
        background:"#8f6f4e",
        margin:"70px auto"
      }}
    />
  )
}

function PageContent(){

// wedding date
const weddingDate = new Date("2026-12-12T16:00:00")

// invitados permitidos
const guestList: Record<string,{name:string,token:string}> = {

"luis-perdomo": {
name:"Luis Perdomo",
token:"A82J9K"
},

"ailyn-santana": {
name:"Ailyn Santana",
token:"X9Q3LM"
},

"juan-perez": {
name:"Juan Perez",
token:"P4T7ZD"
},

"maria-gomez": {
name:"Maria Gomez",
token:"K8W2BV"
},

"benito-martinez": {
name:"Benito Martinez",
token:"M5N1XY"
},

"sofia-ramirez": {
name:"Sofia Ramirez",
token:"Q8W2BV"
},

"aaron-judge": {
name:"Aaron Judge",
token:"R9T3LM"
}

}

// leer parametro del link
const params = useSearchParams()
const guestId = params.get("guest")
const token = params.get("token") 

// verificar si está invitado
const guest = guestId ? guestList[guestId] : null
const guestName = guest?.name

//Validar Token
const isValidGuest = guest && token === guest.token

//Respuesta registrada
const [alreadyAnswered,setAlreadyAnswered] = useState(false)

useEffect(()=>{

async function checkRSVP(){

if(!guestName) return

const q = query(
collection(db,"rsvp"),
where("guestId","==",guestId)
)

const snapshot = await getDocs(q)

if(!snapshot.empty){
setAlreadyAnswered(true)
}

}

checkRSVP()

},[guestName])

// estados
const [attending,setAttending] = useState("Sí asistiré")
const [timeLeft, setTimeLeft] = useState("")



useEffect(() => {

const interval = setInterval(() => {

const now = new Date().getTime()
const distance = weddingDate.getTime() - now

const days = Math.floor(distance / (1000 * 60 * 60 * 24))
const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
const seconds = Math.floor((distance % (1000 * 60)) / 1000)

setTimeLeft(`${days} : ${hours} : ${minutes} : ${seconds}`)

},1000)

return () => clearInterval(interval)

},[])

const [time,setTime] = useState("")
const [submitted,setSubmitted] = useState(false)
const [playing,setPlaying] = useState(false)

const [showGift,setShowGift] = useState(false)

const totalPhotos = 22
const [selectedImage,setSelectedImage] = useState<number | null>(null)

const [menuOpen,setMenuOpen] = useState(false)

useEffect(()=>{

AOS.init()

const interval = setInterval(()=>{

const now = new Date()

const diff = weddingDate.getTime() - now.getTime()

const days = Math.floor(diff/(1000*60*60*24))
const hours = Math.floor((diff/(1000*60*60))%24)
const minutes = Math.floor((diff/(1000*60))%60)

setTime(`${days} ${hours} ${minutes}`)

},1000)

return ()=>clearInterval(interval)

},[])

async function handleSubmit(e:any){

e.preventDefault()

if(alreadyAnswered){
alert("Ya hemos recibido tu confirmación.")
return
}

await addDoc(collection(db,"rsvp"),{

guestId: guestId,
guestName: guestName,
attending: attending,
created: new Date()

})

setSubmitted(true)

}

function toggleMusic(){

const audio = document.getElementById("music") as HTMLAudioElement

if(playing){
audio.pause()
}else{
audio.play()
}

setPlaying(!playing)

}

return(

<div style={{
fontFamily:"serif",
background:"#faf8f5",
color:"#333"
}}>

{/* NAVBAR */}

<div className="navbar">

{/* BOTON HAMBURGUESA */}

<div
className="menu-toggle"
onClick={()=>setMenuOpen(!menuOpen)}
>
<span></span>
<span></span>
<span></span>
</div>

{/* LINKS */}

<div className={`nav-links ${menuOpen ? "open" : ""}`}>

<a href="#inicio">Inicio</a>
<a href="#historia">Historia</a>
<a href="#galeria">Galería</a>
<a href="#evento">Evento</a>
<a href="#faq">FAQ</a>
<a href="#rsvp">RSVP</a>

</div>

</div>

{/* HERO */}

<section id="inicio" style={{
position:"relative",
height:"100vh",
display:"flex",
alignItems:"center",
justifyContent:"center",
textAlign:"center",
color:"white"
}}>

{/* VIDEO */}
<video
autoPlay
muted
loop
playsInline
style={{
position:"absolute",
width:"100%",
height:"100%",
objectFit:"cover",
top:0,
left:0
}}
>
<source src="/nature.mp4" type="video/mp4" />
</video>

{/* OVERLAY */}

<div style={{
position:"absolute",
width:"100%",
height:"100%",
background:"linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.55) 100%)"
}} />

{/* HERO CONTENT */}
<div style={{
position:"relative",
zIndex:2,
maxWidth:"800px",
margin:"auto",
padding:"0 20px"
}}>

<p style={{
letterSpacing:"12px",
fontSize:"12px",
marginBottom:"20px",
opacity:0.85
}}>
NUESTRA BODA
</p>

<h1 style={{
fontFamily:"var(--font-elegant)",
fontWeight:300,
letterSpacing:"12px",
textTransform:"uppercase",
fontSize:"clamp(48px, 10vw, 90px)"
}}>
<span>Luis</span>{" "}
<span style={{fontWeight:200}}>&</span>{" "}
<span>Ailyn</span>
</h1>

</div>

{/* INFO BOTTOM */}
<div style={{
position:"absolute",
bottom:"30px",
width:"100%",
display:"flex",
justifyContent:"space-between",
padding:"0 20px",
fontSize:"12px",
letterSpacing:"3px",
opacity:0.9
}}>

<span>
12 DE DICIEMBRE 2026
</span>

<span>
SAN JOSÉ DE OCOA, RD
</span>

</div>

</section>

{/* INVITACION */}

<div
id="invitacion"
data-aos="fade-up"
style={{
padding:"100px 20px",
textAlign:"center",
background:"#f5f1ea"
}}
>

<div id="historia" className="section-light" style={{ position:"relative" }}>

<div className="divider"></div>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(24px, 4vw, 36px)",
marginBottom:"20px"
}}>
Estás invitado
</h2>

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Nos llena de alegría que estés aquí y que formes parte
de este momento tan especial en nuestras vidas.
Hemos creado este espacio para compartir contigo
todos los detalles de nuestra boda.

<br/><br/>

Gracias por acompañarnos en el inicio
de esta nueva etapa juntos.
</p>

{/* FLOR DECORATIVA */}

<img
src="/floral.png"
alt=""
style={{
position:"absolute",
right:"-60px",
top:"120px",
width:"420px",
opacity:"0.35",
pointerEvents:"none"
}}
/>

</div>

<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"4px",
fontWeight:300,
fontSize:"24px",
marginTop:"40px"
}}>
Luis & Ailyn
</p>

</div>

<section className="section-dark">

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(24px, 4vw, 42px)",
marginBottom:"30px"
}}>
Nuestro para siempre comienza en
</h2>

<div style={{
fontFamily:"var(--font-elegant)",
fontSize:"clamp(40px, 8vw, 64px)",
letterSpacing:"6px",
fontWeight:300
}}>
{timeLeft}
</div>

<p style={{
marginTop:"20px",
letterSpacing:"4px",
fontSize:"12px",
fontFamily:"var(--font-body)",
color:"#aaa"
}}>
DÍAS &nbsp;&nbsp;&nbsp; HORAS &nbsp;&nbsp;&nbsp; MINUTOS &nbsp;&nbsp;&nbsp; SEGUNDOS
</p>

</section>

<section
data-aos="fade-up"
style={{
background:"#f6f3ee",
padding:"120px 20px",
textAlign:"center"
}}
>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(26px, 5vw, 40px)",
marginBottom:"20px",
color:"#3b2b20"
}}>
Nuestra Historia
</h2>

<div style={{
maxWidth:"700px",
margin:"80px auto",
textAlign:"center"
}}>
{/* PÁRRAFO 1 */}
<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Nos conocimos trabajando en un call center.  
La primera vez que hablamos fue cuando Luis preguntó  
a qué hora ella tomaría su almuerzo para saber  
cuándo le tocaba salir a él.
</p>

{/* PÁRRAFO 2 */}
<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Lo que empezó como una conversación casual  
se convirtió en una amistad, luego en algo mucho más.
</p>

{/* FRASE DESTACADA */}
<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Y sin darnos cuenta, comenzó nuestra historia.
</p>

{/* PÁRRAFO 3 */}
<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Con el tiempo llegaron los viajes, las aventuras  
y los momentos que hoy forman parte de nuestra historia.
</p>

</div>

</section>

<section
id="timeline"
style={{
background:"#f6f3ee",
padding:"120px 20px",
textAlign:"center",
position:"relative"
}}
>

<img
  src="/floral-top.png"
  style={{
    position:"absolute",
    top:"-40px",
    left:"0",
    width:"280px",
    opacity:0.45,
    pointerEvents:"none",
    filter:"sepia(1) saturate(3) hue-rotate(90deg) brightness(0.45)"
  }}
/>
  
<h2 style={{
fontFamily:"var(--font-elegant)",
fontSize:"clamp(32px, 6vw, 52px)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
marginBottom:"80px",
color:"#3b2b20"
}}>
Memory Lane
</h2>

<div style={{
position:"relative",
maxWidth:"900px",
margin:"auto",
padding:"0 20px"
}}>

{/* linea vertical */}
<div style={{
position:"absolute",
left:"50%",
top:"0",
bottom:"0",
width:"2px",
background:"#e4ddd4",
transform:"translateX(-50%)"
}}/>

<div style={{
position:"absolute",
left:"50%",
top:"60px",
width:"10px",
height:"10px",
background:"#c9a27e",
borderRadius:"50%",
transform:"translateX(-50%)"
}}/>


{/* evento 1 */}
<div style={{
display:"flex",
justifyContent:"flex-start",
marginBottom:"80px",
padding:"0 20px"
}}>

<div style={{
width:"45%",
paddingLeft:"40px",
background:"white",
padding:"18px",
boxShadow:"0 20px 40px rgba(0,0,0,0.12)",
borderRadius:"4px",
transform:"rotate(-2deg)"
}}>

<img
src="/story1.jpg"
style={{
width:"100%",
maxHeight:"clamp(180px, 35vw, 260px)",
objectFit:"cover",
borderRadius:"6px",
marginBottom:"10px"
}}
/>

<h3 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"4px",
fontWeight:300,
color:"#6b705c"
}}>
2017
</h3>

<p style={{
fontFamily:"var(--font-body)",
color:"#6b635b",
lineHeight:"1.6"
}}>
Donde todo comenzó
</p>

</div>
</div>

<div style={{
position:"absolute",
left:"50%",
top:"360px",
width:"10px",
height:"10px",
background:"#c9a27e",
borderRadius:"50%",
transform:"translateX(-50%)"
}}/>

{/* evento 2 */}
<div style={{
display:"flex",
justifyContent:"flex-end",
marginBottom:"80px",
padding:"0 20px"
}}>
<div style={{
width:"45%",
paddingRight:"40px",
background:"white",
padding:"18px",
boxShadow:"0 20px 40px rgba(0,0,0,0.12)",
borderRadius:"4px",
transform:"rotate(2deg)"
}}>
<img
src="/story2.jpg"
style={{
width:"100%",
maxHeight:"clamp(180px, 35vw, 260px)",
objectFit:"cover",
borderRadius:"6px",
marginBottom:"10px"
}}
/>

<h3 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"4px",
fontWeight:300,
color:"#6b705c"
}}>
2024
</h3>

<p style={{
fontFamily:"var(--font-body)",
color:"#6b635b",
lineHeight:"1.6"
}}>
Nuestro primer viaje juntos
</p>

</div>
</div>

<div style={{
position:"absolute",
left:"50%",
top:"600px",
width:"12px",
height:"12px",
background:"#c9a27e",
borderRadius:"50%",
transform:"translateX(-50%)"
}}/>

{/* evento 3 */}
<div style={{
display:"flex",
justifyContent:"flex-start"
}}>
<div style={{
width:"45%",
background:"white",
padding:"20px",
boxShadow:"0 10px 25px rgba(0,0,0,0.08)",
borderRadius:"8px"
}}>

<img
src="/story3.jpg"
style={{
width:"100%",
maxHeight:"clamp(180px, 35vw, 260px)",
objectFit:"cover",
borderRadius:"6px",
marginBottom:"10px"
}}
/>

<h3 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"4px",
fontWeight:300,
color:"#6b705c"
}}>
2024
</h3>

<p style={{
fontFamily:"var(--font-body)",
color:"#6b635b",
lineHeight:"1.6"
}}>
La propuesta
</p>

</div>
</div>

</div>

</section>

{/* MUSICA */}

<section className="section-light" style={{textAlign:"center"}}>

<div className="divider"></div>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(26px, 5vw, 40px)",
marginBottom:"20px",
color:"#3b2b20"
}}>
Nuestra Canción
</h2>

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
La música siempre ha sido parte de nuestra historia.
Esta canción representa momentos, recuerdos
y todo lo que sentimos al comenzar esta nueva etapa juntos.
</p>

<p style={{
marginBottom:"30px",
letterSpacing:"2px",
fontSize:"12px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
🎧 DALE PLAY PARA ESCUCHAR NUESTRA CANCIÓN
</p>

<audio id="music" loop>
<source src="/song.mp3" type="audio/mpeg"/>
</audio>

<button
onClick={toggleMusic}
className="button button-dark"
style={{
fontSize:"14px",
letterSpacing:"2px",
fontFamily:"var(--font-elegant)"
}}
>
{playing ? "⏸ Pausar música" : "▶ Reproducir música"}
</button>

</section>

{/* GALERIA */}

<div id="galeria" className="section-light" data-aos="zoom-in">

<div className="divider"></div>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(26px, 5vw, 40px)",
marginBottom:"20px",
color:"#3b2b20"
}}>
Galería
</h2>

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Momentos de nuestra sesión de pre-boda,
recuerdos que guardaremos para siempre.
</p>


<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",
gap:"22px",
maxWidth:"1000px",
margin:"0 auto"
}}>

{Array.from({length:22}, (_,i)=>i+1).map((n)=>(
<img
key={n}
src={`/photo${n}.jpg`}
onClick={()=>setSelectedImage(n)}
style={{
width:"100%",
height:"clamp(160px, 30vw, 260px)",
objectFit:"cover",
borderRadius:"6px",
cursor:"pointer",
transition:"all .35s ease",
boxShadow:"0 8px 25px rgba(0,0,0,0.08)"
}}
onMouseOver={(e)=>{
e.currentTarget.style.transform="scale(1.05)"
e.currentTarget.style.boxShadow="0 15px 35px rgba(0,0,0,0.15)"
}}
onMouseOut={(e)=>{
e.currentTarget.style.transform="scale(1)"
e.currentTarget.style.boxShadow="0 8px 25px rgba(0,0,0,0.08)"
}}
/>
))}

</div>


{/* VISOR FULLSCREEN */}

{selectedImage && (

<div
onClick={()=>setSelectedImage(null)}
style={{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(30,20,15,0.92)",
display:"flex",
alignItems:"center",
justifyContent:"center",
zIndex:2000
}}
>

{/* BOTON CERRAR */}

<div
onClick={()=>setSelectedImage(null)}
style={{
position:"absolute",
top:"30px",
right:"30px",
fontSize:"28px",
color:"#f5f1ea",
cursor:"pointer",
letterSpacing:"2px",
fontFamily:"var(--font-elegant)"
}}>
✕
</div>


{/* FLECHA IZQUIERDA */}

<div
onClick={(e)=>{
e.stopPropagation()
setSelectedImage(prev =>
prev === 1 ? totalPhotos : prev! - 1
)
}}
style={{
position:"absolute",
left:"20px",
fontSize:"40px",
color:"white",
cursor:"pointer"
}}
>
‹
</div>


{/* IMAGEN */}

<img
  src={`/photo${selectedImage}.jpg`}
  style={{
    maxWidth:"min(500px,90%)",
    maxHeight:"80vh",
    width:"100%",
    borderRadius:"8px",
    boxShadow:"0 20px 60px rgba(0,0,0,0.45)"
  }}
/>


{/* FLECHA DERECHA */}

<div
onClick={(e)=>{
e.stopPropagation()
setSelectedImage(prev =>
prev === totalPhotos ? 1 : prev! + 1
)
}}
style={{
position:"absolute",
right:"20px",
fontSize:"40px",
color:"white",
cursor:"pointer"
}}
>
›
</div>


{/* CONTADOR */}

<div
style={{
position:"absolute",
bottom:"30px",
color:"white",
fontSize:"16px"
}}
>
{selectedImage} / {totalPhotos}
</div>

</div>

)}

</div>

{/* EVENTO */}

<section id="evento" style={{
position:"relative",
padding:"140px 20px",
textAlign:"center",
background:"#3A2A23",
color:"white"
}}>

<div style={{maxWidth:"700px", margin:"auto"}}>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(28px, 6vw, 46px)",
marginBottom:"20px"
}}>
Rancho La Vereda
</h2>

<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"4px",
fontWeight:300,
fontSize:"12px",
opacity:0.8,
marginBottom:"60px"
}}>
SAN JOSÉ DE OCOA · REPÚBLICA DOMINICANA
</p>

{/* MAPA */}
<div style={{
margin:"0 auto",
width:"100%",
maxWidth:"420px",
padding:"14px",
background:"#c7a27c",
borderRadius:"6px",
boxShadow:"0 15px 40px rgba(0,0,0,0.25)"
}}>

<iframe
src="https://www.google.com/maps?q=Rancho%20La%20Vereda&output=embed"
width="100%"
height="260"
style={{
border:0,
borderRadius:"8px"
}}
/>

</div>

{/* TEXTO */}
<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#e6ddd5",
fontFamily:"var(--font-elegant)"
}}>
Habrá estacionamiento disponible en el lugar.
Nuestro equipo estará listo para guiarte al llegar.
</p>

</div>

</section>

{/* WHERE TO STAY */}

<section className="section-dark">

<div className="divider"></div>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(26px, 5vw, 40px)",
marginBottom:"20px"
}}>
Dónde hospedarse
</h2>

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#e6ddd5",
fontFamily:"var(--font-elegant)"
}}>
Si deseas quedarte en el pueblo durante el fin de semana,
te compartimos algunas opciones de hospedaje cercanas al lugar de la celebración.

La disponibilidad puede variar, por lo que recomendamos reservar con anticipación.
</p>

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
gap:"20px",
maxWidth:"600px",
margin:"0 auto"
}}>

<a
href="https://www.airbnb.com/rooms/1578611592370803713?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1773350534_P3tlWpq0WhEHqmon&previous_page_section_name=1000&federated_search_id=737daf10-e7c6-4653-aad5-572a1891177a"
target="_blank"
className="button button-light"
style={{
textAlign:"center",
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"13px"
}}
>
Hospedaje· OPCIÓN 1
</a>

<a
href="https://www.airbnb.com/rooms/45363133?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1773350244_P3CRes561-lpuuBH&previous_page_section_name=1000&federated_search_id=19bfe742-2ed3-44e2-88d5-4bf9ba9e8b3a"
target="_blank"
className="button button-light"
style={{
textAlign:"center",
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"13px"
}}
>
Hospedaje· OPCIÓN 2
</a>

<a
href="https://www.airbnb.com/rooms/1574242168305632524?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1773350244_P37Gxra0V44o2pTh&previous_page_section_name=1000&federated_search_id=19bfe742-2ed3-44e2-88d5-4bf9ba9e8b3a"
target="_blank"
className="button button-light"
style={{
textAlign:"center",
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"13px"
}}
>
Hospedaje· OPCIÓN 3
</a>

<a
href="https://www.airbnb.com/rooms/696995000546828193?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1773350244_P3aJR9HndKSkFdaP&previous_page_section_name=1000&federated_search_id=19bfe742-2ed3-44e2-88d5-4bf9ba9e8b3a"
target="_blank"
className="button button-light"
style={{
textAlign:"center",
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"13px"
}}
>
Hospedaje· OPCIÓN 4
</a>

</div>

</section>


{/* PLAYLIST */}

<section className="section-light" style={{textAlign:"center"}}>

<div className="divider"></div>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(26px, 5vw, 40px)",
marginBottom:"20px",
color:"#3b2b20"
}}>
Nuestra Playlist
</h2>

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Ayúdanos a crear la playlist perfecta para la fiesta.
Agrega tus canciones favoritas para celebrar con nosotros
y hacer de la noche algo aún más especial 🎶
</p>

<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"12px",
color:"#8a8178",
marginBottom:"30px"
}}>
CONTRIBUYE A NUESTRA PLAYLIST EN SPOTIFY
</p>

<a
href="https://open.spotify.com/playlist/2da7zmucwCTjehbLgaBcxR?si=5bae9463894248a5&pt=7b2020ccfe79c28e13b1b6f7b822ccd5"
target="_blank"
className="button button-dark"
style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"13px"
}}
>
AGREGAR CANCIÓN
</a>

</section>

{/* REGALOS */}

<section className="section-dark" style={{textAlign:"center"}}>

<div className="divider"></div>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(26px, 5vw, 40px)",
marginBottom:"20px"
}}>
Nota sobre regalos
</h2>

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#e6ddd5",
fontFamily:"var(--font-elegant)"
}}>
Su presencia en nuestra boda es el mejor regalo que podríamos recibir.

<br/><br/>

Si desean hacernos un detalle adicional,
hemos preparado la siguiente opción.
</p>

{/* LABEL */}
<p style={{
marginTop:"30px",
fontFamily:"var(--font-elegant)",
letterSpacing:"3px",
fontSize:"18px",
opacity:0.7
}}>
OPCIÓN DE REGALO
</p>

{/* CUENTAS */}
<div style={{
marginTop:"25px",
display:"flex",
flexDirection:"column",
gap:"30px",
alignItems:"center"
}}>

{/* CUENTA 1 */}
<div>
<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"3px",
fontSize:"15px",
opacity:0.7,
marginBottom:"10px"
}}>
BANCO POPULAR
</p>

<p style={{
fontFamily:"var(--font-body)",
lineHeight:"1.6",
color:"#e6ddd5"
}}>
Cuenta corriente: 816921621<br/>
Titular: Ailyn Santana
</p>
</div>

{/* DIVIDER */}
<div style={{
width:"40px",
height:"1px",
background:"#c7a27c"
}}/>

{/* CUENTA 2 */}
<div>
<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"3px",
fontSize:"15px",
opacity:0.7,
marginBottom:"10px"
}}>
BHD
</p>

<p style={{
fontFamily:"var(--font-body)",
lineHeight:"1.6",
color:"#e6ddd5"
}}>
Cuenta de ahorro: 34139820016<br/>
Titular: Ailyn Santana
</p>

</div>

{/* CUENTA 3 */}
<div>
<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"3px",
fontSize:"15px",
opacity:0.7,
marginBottom:"10px"
}}>
Banreservas
</p>

<p style={{
fontFamily:"var(--font-body)",
lineHeight:"1.6",
color:"#e6ddd5"
}}>
Cuenta de ahorro: 9606316788<br/>
Titular: Luis Perdomo
</p>

</div>

</div>

</section>

{/* FAQ */}

<section id="faq" className="section-light">

<div className="divider"></div>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(26px, 5vw, 40px)",
marginBottom:"20px",
color:"#3b2b20",
textAlign:"center"
}}>
Preguntas frecuentes
</h2>

<div style={{
maxWidth:"700px",
margin:"40px auto",
textAlign:"left",
display:"flex",
flexDirection:"column",
gap:"30px"
}}>

{/* ITEM */}
<div>
<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"25px",
marginBottom:"8px",
color:"#3b2b20"
}}>
¿A qué hora empieza la ceremonia?
</p>

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"15px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
La ceremonia comenzará a las 3:00 PM. Les recomendamos llegar unos minutos antes.
</p>
</div>

{/* DIVIDER */}
<div style={{
width:"100%",
height:"1px",
background:"#e5ded6"
}}/>

{/* ITEM */}
<div>
<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"25px",
marginBottom:"8px",
color:"#3b2b20"
}}>
¿Se permiten niños?
</p>

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"15px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Hemos decidido que nuestra boda sea una celebración solo para adultos.
</p>
</div>

<div style={{
width:"100%",
height:"1px",
background:"#e5ded6"
}}/>

{/* ITEM */}
<div>
<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"25px",
marginBottom:"8px",
color:"#3b2b20"
}}>
¿Puedo llevar un acompañante?
</p>

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"15px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Debido a la capacidad del evento, las invitaciones no incluyen acompañante adicional. Al menos que se indique lo contrario en la invitación personalizada que recibiste.
</p>
</div>

</div>

</section>

{/* RSVP */}

<section id="rsvp" className="section-light" style={{textAlign:"center"}}>

<div className="divider"></div>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
fontWeight:300,
textTransform:"uppercase",
fontSize:"clamp(26px, 5vw, 40px)",
marginBottom:"20px",
color:"#3b2b20"
}}>
Confirmar asistencia
</h2>

{/* SALUDO */}
{guestName && (
<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"16px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Hola <strong>{guestName}</strong>, nos encantará contar contigo
</p>
)}

{/* TEXTO */}
<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"16px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Invitación personal e intransferible.  
Debido a la capacidad del evento, no será posible incluir acompañantes adicionales.
</p>

{/* VALIDACIONES */}
{!isValidGuest ? (

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"16px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Esta invitación es personal.  
Por favor utiliza el enlace que recibiste para confirmar tu asistencia.
</p>

) : alreadyAnswered ? (

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Ya hemos recibido tu confirmación.  
¡Muchas gracias! 💛
</p>

) : submitted ? (

<p style={{
marginBottom:"30px",
letterSpacing:"0.3px",
fontSize:"20px",
color:"#8a8178",
fontFamily:"var(--font-elegant)"
}}>
Gracias por confirmar ❤️
</p>

) : (

<form
onSubmit={handleSubmit}
style={{
maxWidth:"420px",
margin:"40px auto",
display:"flex",
flexDirection:"column",
gap:"16px"
}}
>

<select
value={attending}
onChange={(e)=>setAttending(e.target.value)}
style={{
padding:"12px",
borderRadius:"6px",
border:"1px solid #e5e0d8",
fontSize:"14px",
fontFamily:"var(--font-body)"
}}
>
<option>Sí asistiré</option>
<option>No podré asistir</option>
</select>

<button
type="submit"
className="button button-dark"
style={{
marginTop:"10px",
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"13px"
}}
>
CONFIRMAR ASISTENCIA
</button>

</form>

)}

</section>

</div>

)

}
export default function Home() {
  return (
    <Suspense fallback={<div>Cargando invitación...</div>}>
      <PageContent />
    </Suspense>
  )
}