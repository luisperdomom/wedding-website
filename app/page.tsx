"use client";

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { db } from "../firebase"
import { collection, addDoc } from "firebase/firestore"
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

const weddingDate = new Date("2026-12-12T16:00:00")

const [timeLeft, setTimeLeft] = useState("")

useEffect(() => {

const interval = setInterval(() => {

const now = new Date().getTime()
const distance = weddingDate.getTime() - now

const days = Math.floor(distance / (1000 * 60 * 60 * 24))
const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))

setTimeLeft(`${days} : ${hours} : ${minutes}`)

},1000)

return () => clearInterval(interval)

},[])

const [time,setTime] = useState("")
const [name,setName] = useState("")
const [attending,setAttending] = useState("Sí asistiré")
const [submitted,setSubmitted] = useState(false)
const [playing,setPlaying] = useState(false)

const [showGift,setShowGift] = useState(false)

const totalPhotos = 22
const [selectedImage,setSelectedImage] = useState<number | null>(null)

const params = useSearchParams()
const guest = params.get("guest")

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

await addDoc(collection(db,"rsvp"),{
name:name,
attending:attending,
created:new Date()
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

<a href="#inicio">Inicio</a>
<a href="#historia">Historia</a>
<a href="#galeria">Galería</a>
<a href="#evento">Evento</a>
<a href="#faq">FAQ</a>
<a href="#rsvp">RSVP</a>

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
margin:"auto"
}}>

<p style={{
letterSpacing:"8px",
fontSize:"12px",
marginBottom:"20px",
opacity:0.85
}}>
NUESTRA BODA
</p>

<h1 className="script" style={{
fontSize:"130px",
lineHeight:"1.1",
marginBottom:"10px"
}}>
Luis & Ailyn
</h1>

</div>

{/* INFO BOTTOM LEFT */}
<div style={{
position:"absolute",
bottom:"40px",
left:"40px",
letterSpacing:"3px",
fontSize:"12px",
opacity:0.9
}}>
12 DE DICIEMBRE 2026
</div>

{/* INFO BOTTOM RIGHT */}
<div style={{
position:"absolute",
bottom:"40px",
right:"40px",
letterSpacing:"3px",
fontSize:"12px",
opacity:0.9
}}>
SAN JOSÉ DE OCOA, RD
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

<h2 className="section-title script">
Estás invitado
</h2>

<p className="section-text">
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

<p className="script" style={{
fontSize:"28px",
marginTop:"30px"
}}>
Luis & Ailyn
</p>

</div>

<section className="section-dark">

<h2 className="script" style={{
fontSize:"42px",
marginBottom:"30px"
}}>
Nuestro para siempre comienza en
</h2>

<div style={{
fontSize:"64px",
letterSpacing:"6px",
fontFamily:"var(--font-title)"
}}>
{timeLeft}
</div>

<p style={{
marginTop:"20px",
letterSpacing:"3px",
fontSize:"12px"
}}>
DÍAS &nbsp;&nbsp;&nbsp; HORAS &nbsp;&nbsp;&nbsp; MINUTOS
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

<h2 className="script section-title">
Nuestra Historia
<div className="divider"></div>
</h2>

<p style={{
maxWidth:"600px",
margin:"auto",
fontSize:"18px",
lineHeight:"1.8",
color:"#4a403a"
}}>

Nos conocimos trabajando en un call center.  
La primera vez que hablamos fue cuando Luis preguntó  
a qué hora ella tomaría su almuerzo para saber  
cuándo le tocaba salir a él.

Lo que empezó como una conversación casual  
se convirtió en una amistad, luego en algo mucho más.

Con el tiempo llegaron los viajes, las aventuras  
y los momentos que hoy forman parte de nuestra historia.

</p>

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
  
<h2 className="script" style={{
fontSize:"60px",
marginBottom:"80px",
color:"#3b2b20"
}}>
Memory Lane
</h2>

<div style={{
maxWidth:"900px",
margin:"auto",
position:"relative"
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
marginBottom:"80px"
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
maxHeight:"260px",
objectFit:"cover",
borderRadius:"6px",
marginBottom:"10px"
}}
/>

<h3 style={{color:"#6b705c"}}>2017</h3>

<p>Donde todo comenzó</p>

</div>
</div>

<div style={{
position:"absolute",
left:"50%",
top:"360px",
width:"12px",
height:"12px",
background:"#c9a27e",
borderRadius:"50%",
transform:"translateX(-50%)"
}}/>

{/* evento 2 */}
<div style={{
display:"flex",
justifyContent:"flex-end",
marginBottom:"80px"
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
maxHeight:"260px",
objectFit:"cover",
borderRadius:"6px",
marginBottom:"10px"
}}
/>

<h3 style={{color:"#6b705c"}}>2024</h3>

<p>Nuestro primer viaje</p>

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
maxHeight:"260px",
objectFit:"cover",
borderRadius:"6px",
marginBottom:"10px"
}}
/>

<h3 style={{color:"#6b705c"}}>2024</h3>

<p>La propuesta</p>

</div>
</div>

</div>

</section>

{/* MUSICA */}

<section className="section-light" style={{textAlign:"center"}}>

<div className="divider"></div>

<h2 className="script section-title">
Nuestra Canción
</h2>

<p style={{
maxWidth:"520px",
margin:"0 auto 30px auto",
fontSize:"17px",
lineHeight:"1.8",
color:"#5a5048"
}}>
La música siempre ha sido parte de nuestra historia.
Esta canción representa momentos, recuerdos
y todo lo que sentimos al comenzar esta nueva etapa juntos.
</p>

<p style={{
marginBottom:"30px",
letterSpacing:"1px",
color:"#7a6f66"
}}>
🎧 Dale play para escuchar nuestra canción
</p>

<audio id="music" loop>
<source src="/song.mp3" type="audio/mpeg"/>
</audio>

<button
onClick={toggleMusic}
className="button button-dark"
style={{
fontSize:"15px",
letterSpacing:"1px"
}}
>
{playing ? "⏸ Pausar música" : "▶ Reproducir música"}
</button>

</section>

{/* GALERIA */}

<div id="galeria" className="section-light" data-aos="zoom-in">

<div className="divider"></div>

<h2 className="script section-title">
Galería
</h2>

<p style={{
maxWidth:"500px",
margin:"0 auto 40px auto",
fontSize:"17px",
lineHeight:"1.8",
color:"#5a5048"
}}>
Momentos de nuestra sesión de pre-boda,
recuerdos que guardaremos para siempre.
</p>


<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
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
height:"260px",
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
style={{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,0.9)",
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
right:"40px",
fontSize:"30px",
color:"white",
cursor:"pointer"
}}
>
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
left:"40px",
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
    maxWidth:"500px",
    maxHeight:"70vh",
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
right:"40px",
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

<section id="evento"></section>
<section style={{
position:"relative",
padding:"140px 20px",
textAlign:"center",
background:"#3A2A23",
color:"white"
}}>

<div style={{
position:"relative",
zIndex:2
}}>

<h2 className="script section-title">
Rancho La Vereda
</h2>

<p style={{
letterSpacing:"1px",
marginBottom:"40px",
opacity:0.9
}}>
San José de Ocoa, República Dominicana
</p>

{/* MAPA */}

<div style={{
display:"inline-block",
padding:"12px",
background:"#c7a27c",
borderRadius:"4px"
}}>

<iframe
src="https://www.google.com/maps?q=Rancho%20La%20Vereda&output=embed"
width="420"
height="260"
style={{
border:0,
display:"block"
}}
/>

<img
src="/venue1.jpg"
style={{
position:"absolute",
left:"10%",
top:"160px",
width:"220px",
padding:"12px",
background:"white",
transform:"rotate(-8deg)",
boxShadow:"0 12px 30px rgba(0,0,0,0.35)",
zIndex:3
}}
/>

<img
src="/venue2.jpg"
style={{
position:"absolute",
right:"10%",
top:"180px",
width:"220px",
padding:"12px",
background:"white",
transform:"rotate(8deg)",
boxShadow:"0 12px 30px rgba(0,0,0,0.35)",
zIndex:3
}}
/>

</div>

<p style={{
marginTop:"30px",
maxWidth:"500px",
marginLeft:"auto",
marginRight:"auto",
lineHeight:"1.8"
}}>
Habrá estacionamiento disponible en el lugar.
Nuestro equipo estará listo para guiarte al llegar.
</p>

</div>

</section>

{/* WHERE TO STAY */}

<section className="section-dark">

<div className="divider"></div>

<h2 className="script section-title">
Dónde hospedarse
</h2>

<p style={{
maxWidth:"600px",
margin:"20px auto 50px auto",
fontSize:"16px",
lineHeight:"1.8",
opacity:0.9
}}>
Para mayor comodidad de nuestros invitados,
hemos seleccionado algunas opciones de hospedaje
cercanas al lugar de la celebración.
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
style={{textAlign:"center"}}
>
HOTEL 1
</a>

<a
href="https://www.airbnb.com/rooms/45363133?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1773350244_P3CRes561-lpuuBH&previous_page_section_name=1000&federated_search_id=19bfe742-2ed3-44e2-88d5-4bf9ba9e8b3a"
target="_blank"
className="button button-light"
style={{textAlign:"center"}}
>
HOTEL 2
</a>

<a
href="https://www.airbnb.com/rooms/1574242168305632524?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1773350244_P37Gxra0V44o2pTh&previous_page_section_name=1000&federated_search_id=19bfe742-2ed3-44e2-88d5-4bf9ba9e8b3a"
target="_blank"
className="button button-light"
style={{textAlign:"center"}}
>
HOTEL 3
</a>

<a
href="https://www.airbnb.com/rooms/696995000546828193?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1773350244_P3aJR9HndKSkFdaP&previous_page_section_name=1000&federated_search_id=19bfe742-2ed3-44e2-88d5-4bf9ba9e8b3a"
target="_blank"
className="button button-light"
style={{textAlign:"center"}}
>
HOTEL 4
</a>

</div>

</section>


{/* PLAYLIST */}

<section className="section-light" style={{textAlign:"center"}}>

<div className="divider"></div>

<h2 className="script section-title">
Nuestra Playlist
</h2>

<p style={{
maxWidth:"560px",
margin:"0 auto 40px auto",
fontSize:"17px",
lineHeight:"1.8",
color:"#5a5048"
}}>
Ayúdanos a crear la playlist perfecta para la fiesta.
Agrega tus canciones favoritas para celebrar con nosotros
y hacer de la noche algo aún más especial 🎶
</p>

<a
href="https://open.spotify.com/playlist/2da7zmucwCTjehbLgaBcxR?si=5bae9463894248a5&pt=7b2020ccfe79c28e13b1b6f7b822ccd5"
target="_blank"
className="button button-dark"
>

Agregar canción a la playlist

</a>

</section>

{/* REGALOS */}

<section className="section-dark" style={{textAlign:"center"}}>

<div className="divider"></div>

<h2 className="script section-title">
Nota sobre regalos
</h2>

<p style={{
maxWidth:"620px",
margin:"20px auto",
lineHeight:"1.8",
opacity:0.9
}}>
Su presencia en nuestra boda es el mejor regalo que
podríamos recibir. Para quienes deseen hacernos un
detalle adicional, hemos preparado esta opción.
</p>

<button
onClick={()=>setShowGift(true)}
className="button button-light"
style={{marginTop:"20px"}}
>
Ver información
</button>

</section>

{/* MODAL REGALOS */}

{showGift && (

<div style={{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,0.7)",
display:"flex",
alignItems:"center",
justifyContent:"center",
zIndex:3000
}}>

<div style={{
background:"#F5F1EA",
padding:"40px",
borderRadius:"8px",
maxWidth:"400px",
textAlign:"center",
position:"relative"
}}>

<div
onClick={()=>setShowGift(false)}
style={{
position:"absolute",
right:"15px",
top:"10px",
cursor:"pointer",
fontSize:"20px"
}}
>
✕
</div>

<h3 style={{marginBottom:"20px"}}>
Transferencia bancaria
</h3>

<p style={{marginBottom:"15px"}}>
Banco Popular
<br/>
Cuenta: 123456789
<br/>
A nombre de Luis Perdomo
</p>

<p>
Banco BHD
<br/>
Cuenta: 987654321
<br/>
A nombre de Ailyn Santana
</p>

</div>

</div>

)}

{/* FAQ */}

<section id="faq" className="section-light">

<div className="divider"></div>

<h2 className="script section-title">
Preguntas frecuentes
</h2>

<div style={{
maxWidth:"700px",
margin:"40px auto",
textAlign:"left"
}}>

<div style={{marginBottom:"30px"}}>
<h3>¿A qué hora empieza la ceremonia?</h3>
<p>La ceremonia comenzará a las 3:00 PM. Les recomendamos llegar unos minutos antes.</p>
</div>

<div style={{marginBottom:"30px"}}>
<h3>¿Se permiten niños?</h3>
<p>Hemos decidido que nuestra boda sea una celebración solo para adultos.</p>
</div>

<div style={{marginBottom:"30px"}}>
<h3>¿Puedo llevar un acompañante?</h3>
<p>Debido a la capacidad del evento, las invitaciones no incluyen acompañante adicional.</p>
</div>

</div>

</section>

{/* RSVP */}

<section id="rsvp" className="section-light" style={{textAlign:"center"}}>

<div className="divider"></div>

<h2 className="script section-title">
Confirmar Asistencia
</h2>

<p style={{
fontSize:"15px",
color:"#6b635b",
maxWidth:"420px",
margin:"0 auto 30px auto",
lineHeight:"1.7"
}}>
Invitación personal e intransferible.  
Debido a la capacidad del evento, no será posible incluir acompañantes adicionales.
</p>

{submitted ? (

<p style={{
fontSize:"22px",
marginTop:"30px"
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

<input
placeholder="Nombre"
value={name}
onChange={(e)=>setName(e.target.value)}
style={{
padding:"12px",
borderRadius:"6px",
border:"1px solid #e5e0d8",
fontSize:"15px"
}}
/>

<select
value={attending}
onChange={(e)=>setAttending(e.target.value)}
style={{
padding:"12px",
borderRadius:"6px",
border:"1px solid #e5e0d8",
fontSize:"15px"
}}
>
<option>Sí asistiré</option>
<option>No podré asistir</option>
</select>

<button
type="submit"
className="button button-dark"
style={{marginTop:"10px"}}
>
Confirmar asistencia
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