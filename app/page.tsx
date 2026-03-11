"use client";

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { db } from "../firebase"
import { collection, addDoc } from "firebase/firestore"
import AOS from "aos"
import "aos/dist/aos.css"

function Divider(){
  return(
    <div style={{
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      margin:"60px 0"
    }}>
      <div style={{height:"1px",background:"#ddd",width:"120px"}}/>
      <span style={{margin:"0 15px",fontSize:"18px",color:"#c9a27e"}}>
        💍
      </span>
      <div style={{height:"1px",background:"#ddd",width:"120px"}}/>
    </div>
  )
}

export default function Home(){

const weddingDate = new Date("2027-03-14")

const [time,setTime] = useState("")
const [name,setName] = useState("")
const [attending,setAttending] = useState("Sí asistiré")
const [submitted,setSubmitted] = useState(false)
const [playing,setPlaying] = useState(false)
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

<div style={{fontFamily:"serif"}}>

{/* NAVBAR */}

<div style={{
position:"fixed",
top:0,
width:"100%",
background:"rgba(255,255,255,0.9)",
display:"flex",
justifyContent:"center",
gap:"30px",
padding:"15px",
zIndex:1000
}}>

<a href="#inicio" style={{textDecoration:"none",color:"#444",letterSpacing:"1px"}}>Inicio</a>
<a href="#historia" style={{textDecoration:"none",color:"#444",letterSpacing:"1px"}}>Historia</a>
<a href="#galeria" style={{textDecoration:"none",color:"#444",letterSpacing:"1px"}}>Galería</a>
<a href="#evento" style={{textDecoration:"none",color:"#444",letterSpacing:"1px"}}>Evento</a>
<a href="#rsvp" style={{textDecoration:"none",color:"#444",letterSpacing:"1px"}}>RSVP</a>

</div>

{/* HERO */}

<div id="inicio" style={{
height:"100vh",
backgroundImage:"url('/couple.jpg')",
backgroundSize:"cover",
backgroundPosition:"center",
display:"flex",
alignItems:"center",
justifyContent:"center",
textAlign:"center",
color:"white"
}}>

<div style={{
background:"rgba(0,0,0,0.35)",
padding:"60px",
borderRadius:"10px"
}}>

<h1 style={{
fontFamily:"Great Vibes",
fontSize:"90px",
color:"#ffffff"
}}>
Luis
</h1>

<h2 style={{fontSize:"40px"}}>&</h2>

<h1 style={{
fontFamily:"Great Vibes",
fontSize:"90px",
color:"#ffffff"
}}>
Ailyn
</h1>

{guest && (
<p style={{marginTop:"20px",fontSize:"22px"}}>
{guest}, estás invitado(a) a nuestra boda 💍
</p>
)}

<p style={{fontSize:"20px",letterSpacing:"2px"}}>
Nos Casamos
</p>

<p style={{fontSize:"22px",letterSpacing:"3px"}}>
14 Marzo 2027
</p>

<div style={{
display:"flex",
gap:"25px",
justifyContent:"center",
marginTop:"30px"
}}>

<div>
<h2>{time.split(" ")[0]}</h2>
<p>días</p>
</div>

<div>
<h2>{time.split(" ")[1]}</h2>
<p>horas</p>
</div>

<div>
<h2>{time.split(" ")[2]}</h2>
<p>min</p>
</div>

</div>

<div style={{marginTop:"40px"}}>

<a
href="#historia"
style={{
padding:"12px 25px",
border:"1px solid white",
borderRadius:"30px",
textDecoration:"none",
color:"white"
}}
>
Ver Invitación ↓
</a>

</div>

</div>

</div>

<Divider/>

{/* MUSICA */}

<div style={{
textAlign:"center",
padding:"60px"
}}>

<h2 style={{
fontSize:"36px",
letterSpacing:"2px",
marginBottom:"10px"
}}>
Nuestra Canción
</h2>

<p style={{color:"#777",marginBottom:"20px"}}>
🎧 Dale play para escuchar nuestra canción
</p>

<audio id="music" loop>
<source src="/song.mp3" type="audio/mpeg"/>
</audio>

<button
onClick={toggleMusic}
style={{
padding:"12px 28px",
background:"#6b7d5c",
color:"white",
border:"none",
borderRadius:"30px",
cursor:"pointer",
fontSize:"16px"
}}
>
{playing ? "⏸ Pausar música" : "▶ Reproducir música"}
</button>

</div>

<Divider/>

{/* HISTORIA */}

<div id="historia" data-aos="fade-up" style={{
padding:"80px",
textAlign:"center"
}}>

<h2 style={{
fontSize:"36px",
letterSpacing:"2px",
marginBottom:"20px"
}}>
Nuestra Historia
</h2>

<p style={{
maxWidth:"600px",
margin:"auto",
fontSize:"18px"
}}>
Nos conocimos trabajando en un call center.
La primera vez que hablamos fue cuando Luis preguntó
a qué hora ella tomaría su almuerzo para saber
cuándo le tocaba salir a él.
</p>

</div>

<Divider/>

{/* GALERIA */}

<div id="galeria" data-aos="zoom-in" style={{
padding:"80px",
background:"#f8f8f8",
textAlign:"center"
}}>

<h2 style={{
fontSize:"36px",
letterSpacing:"2px",
marginBottom:"20px"
}}>
Galería
</h2>

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
gap:"20px",
maxWidth:"1000px",
margin:"40px auto"
}}>

{Array.from({length:22}, (_,i)=>i+1).map((n)=>(
<img
key={n}
src={`/photo${n}.jpg`}
onClick={()=>setSelectedImage(n)}
style={{
width:"100%",
borderRadius:"10px",
transition:"0.3s",
cursor:"pointer"
}}
onMouseOver={(e)=>{
e.currentTarget.style.transform="scale(1.05)"
}}
onMouseOut={(e)=>{
e.currentTarget.style.transform="scale(1)"
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
maxWidth:"90%",
maxHeight:"90%",
borderRadius:"10px"
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

<Divider/>

{/* EVENTO */}

<div id="evento" data-aos="fade-up" style={{
padding:"80px",
textAlign:"center"
}}>

<h2 style={{
fontSize:"36px",
letterSpacing:"2px",
marginBottom:"20px"
}}>
Detalles del Evento
</h2>

<p>
Rancho La Vereda
<br/>
Santo Domingo
</p>

<iframe
src="https://www.google.com/maps?q=Rancho%20La%20Vereda&output=embed"
width="100%"
height="350"
style={{border:0,borderRadius:"10px"}}
/>

</div>

<Divider/>

{/* PLAYLIST */}

<div style={{
padding:"80px",
textAlign:"center",
background:"#f8f8f8"
}}>

<h2 style={{
fontSize:"36px",
letterSpacing:"2px",
marginBottom:"20px"
}}>
Nuestra Playlist de Boda
</h2>

<p style={{
maxWidth:"600px",
margin:"auto",
marginBottom:"30px"
}}>
Ayúdanos a crear la playlist perfecta para la fiesta.
Agrega tus canciones favoritas para celebrar con nosotros 🎶
</p>

<a
href="https://open.spotify.com/playlist/2da7zmucwCTjehbLgaBcxR?si=5bae9463894248a5&pt=7b2020ccfe79c28e13b1b6f7b822ccd5"
target="_blank"
style={{
padding:"14px 30px",
background:"#6b7d5c",
color:"white",
borderRadius:"30px",
textDecoration:"none"
}}
>

Agregar canción a la playlist

</a>

</div>

<Divider/>

{/* REGALOS */}

<div style={{
padding:"80px",
textAlign:"center"
}}>

<h2 style={{
fontSize:"36px",
letterSpacing:"2px",
marginBottom:"20px"
}}>
Regalos
</h2>

<p style={{
maxWidth:"600px",
margin:"auto",
fontSize:"18px",
lineHeight:"1.6"
}}>

Su compañía en este día tan especial es nuestro mayor regalo.  
Pero si desean tener un detalle con nosotros,
agradeceremos cualquier contribución para comenzar
esta nueva etapa juntos.

</p>

</div>
<Divider/>

{/* RSVP */}

<div id="rsvp" style={{
padding:"80px",
textAlign:"center"
}}>

<h2 style={{
fontSize:"36px",
letterSpacing:"2px",
marginBottom:"20px"
}}>
Confirmar Asistencia
</h2>

<p style={{fontSize:"14px",color:"#666"}}>
Invitación personal e intransferible.
No será posible incluir acompañantes.
</p>

{submitted ? (

<p style={{fontSize:"20px"}}>
Gracias por confirmar ❤️
</p>

) : (

<form
onSubmit={handleSubmit}
style={{
maxWidth:"400px",
margin:"40px auto",
display:"flex",
flexDirection:"column",
gap:"15px"
}}
>

<input
placeholder="Nombre"
value={name}
onChange={(e)=>setName(e.target.value)}
style={{padding:"10px"}}
/>

<select
value={attending}
onChange={(e)=>setAttending(e.target.value)}
style={{padding:"10px"}}
>

<option>Sí asistiré</option>
<option>No podré asistir</option>

</select>

<button
type="submit"
style={{
padding:"14px 30px",
background:"#6b7d5c",
color:"white",
border:"none",
borderRadius:"30px"
}}
>
Confirmar asistencia
</button>

</form>

)}

</div>

</div>

)

}