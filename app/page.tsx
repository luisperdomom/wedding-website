"use client";

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { db } from "../firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import AOS from "aos"
import "aos/dist/aos.css"

import Countdown from "@/components/Countdown"
import MusicPlayer from "@/components/MusicPlayer"
import Gallery from "@/components/Gallery"
import RSVPForm from "@/components/RSVPForm"
import Image from "next/image"
import GoldenPetals from "@/components/GoldenPetals"

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

// leer parametro del link
const params = useSearchParams()
const guestId = params.get("guest")
const token = params.get("token") 

// estados dinámicos de validación
const [guestName, setGuestName] = useState<string | null>(null)
const [isValidGuest, setIsValidGuest] = useState<boolean | null>(null) // null = cargando, true = válido, false = inválido
const [alreadyAnswered, setAlreadyAnswered] = useState(false)

useEffect(() => {
  async function verifyGuest() {
    if (!guestId || !token) {
      setIsValidGuest(false)
      return
    }

    try {
      const guestRef = doc(db, "guests", guestId)
      const guestSnap = await getDoc(guestRef)

      if (guestSnap.exists()) {
        const guestData = guestSnap.data()
        if (guestData.token === token) {
          setGuestName(guestData.name)
          setIsValidGuest(true)

          // Verificar si ya tiene respuesta registrada
          const q = query(
            collection(db, "rsvp"),
            where("guestId", "==", guestId)
          )
          const snapshot = await getDocs(q)
          if (!snapshot.empty) {
            setAlreadyAnswered(true)
          }
        } else {
          setIsValidGuest(false)
        }
      } else {
        setIsValidGuest(false)
      }
    } catch (error) {
      console.error("Error al validar invitado:", error)
      setIsValidGuest(false)
    }
  }

  verifyGuest()
}, [guestId, token])

// estados
const [showGift,setShowGift] = useState(false)
const [menuOpen,setMenuOpen] = useState(false)
const [openFAQ,setOpenFAQ] = useState<number | null>(null)

const [copiedText, setCopiedText] = useState<string | null>(null)

const handleCopyAccount = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2500)
  })
}

useEffect(()=>{
  AOS.init({
    duration: 1000,
    once: true
  })
},[])

if (isValidGuest === null) {
  return (
    <div style={{
      fontFamily: "var(--font-elegant)",
      background: "#faf8f5",
      color: "#3A2A23",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "20px"
    }}>
      <p className="animate-pulse uppercase text-sm" style={{ letterSpacing: "4px" }}>
        Iniciando Invitación Privada...
      </p>
    </div>
  )
}

if (isValidGuest === false) {
  return (
    <div style={{
      fontFamily: "var(--font-elegant)",
      background: "#faf8f5",
      color: "#3A2A23",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "40px 20px",
      position: "relative",
      overflow: "hidden"
    }}>
      <GoldenPetals />
      
      <div style={{
        maxWidth: "460px",
        background: "white",
        padding: "40px 30px",
        borderRadius: "16px",
        boxShadow: "0 15px 40px rgba(58, 42, 35, 0.05)",
        border: "1px solid #e5e0d8",
        zIndex: 20
      }}>
        <div style={{ position: "relative", width: "95px", height: "95px", margin: "0 auto 20px auto" }}>
          <Image
            src="/logo2.jpeg"
            alt="Logo Luis & Ailyn"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <h2 style={{
          fontFamily: "var(--font-elegant)",
          letterSpacing: "4px",
          fontWeight: 300,
          textTransform: "uppercase",
          fontSize: "24px",
          marginBottom: "20px",
          color: "#3A2A23"
        }}>
          Invitación Privada
        </h2>

        <p style={{
          fontFamily: "var(--font-body)",
          lineHeight: "1.8",
          fontSize: "14px",
          color: "#8a8178",
          marginBottom: "30px",
          padding: "0 10px"
        }}>
          Esta invitación es personal e intransferible. Para acceder a los detalles y confirmar tu asistencia, por favor utiliza el enlace de acceso personal que recibiste.
        </p>

        <div style={{
          width: "60px",
          height: "1px",
          background: "#c7a27c",
          margin: "20px auto"
        }} />

        <h3 style={{
          fontFamily: "var(--font-elegant)",
          letterSpacing: "3px",
          fontWeight: 300,
          fontSize: "16px",
          color: "#3A2A23"
        }}>
          Luis & Ailyn
        </h3>
        <p style={{
          fontSize: "11px",
          letterSpacing: "2px",
          opacity: 0.7,
          marginTop: "5px",
          fontFamily: "var(--font-elegant)"
        }}>
          12 DE DICIEMBRE DE 2026
        </p>
      </div>
    </div>
  )
}

return(

<div style={{
fontFamily:"serif",
background:"#faf8f5",
color:"#333"
}}>

<GoldenPetals />

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

<a href="#inicio" onClick={()=>setMenuOpen(false)}>Inicio</a>

<a href="#historia" onClick={()=>setMenuOpen(false)}>Historia</a>

<a href="#galeria" onClick={()=>setMenuOpen(false)}>Galería</a>

<a href="#evento" onClick={()=>setMenuOpen(false)}>Evento</a>

<a href="#vestimenta" onClick={()=>setMenuOpen(false)}>Vestimenta</a>

<a href="#faq" onClick={()=>setMenuOpen(false)}>FAQ</a>

<a href="#rsvp" onClick={()=>setMenuOpen(false)}>RSVP</a>

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
preload="auto"
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
<a
href="#invitacion"
style={{
display:"inline-block",
marginTop:"40px",
fontFamily:"var(--font-elegant)",
letterSpacing:"5px",
fontSize:"12px",
textTransform:"uppercase",
color:"white",
textDecoration:"none",
opacity:"0.85",
transition:"0.3s"
}}
onMouseOver={(e)=>{
e.currentTarget.style.opacity="1"
e.currentTarget.style.transform="translateY(3px)"
}}
onMouseOut={(e)=>{
e.currentTarget.style.opacity="0.85"
e.currentTarget.style.transform="translateY(0px)"
}}
>
Descubrir más ↓
</a>

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

<div style={{ position: "absolute", right: "-60px", top: "120px", width: "420px", height: "420px", opacity: 0.35, pointerEvents: "none" }}>
  <Image
    src="/floral.png"
    alt=""
    fill
    sizes="420px"
    className="object-contain"
  />
</div>

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

<Countdown targetDate="2026-12-12T16:00:00" />

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

<div style={{ position: "absolute", top: "-40px", left: "0", width: "280px", height: "200px", opacity: 0.45, pointerEvents: "none", filter: "sepia(1) saturate(3) hue-rotate(90deg) brightness(0.45)" }}>
  <Image
    src="/floral-top.png"
    alt=""
    fill
    sizes="280px"
    className="object-contain object-left-top"
  />
</div>
  
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
<div 
  data-aos="fade-right"
  style={{
    display:"flex",
    justifyContent:"flex-start",
    marginBottom:"80px",
    padding:"0 20px"
  }}
>

<div style={{
  width:"45%",
  paddingLeft:"40px",
  background:"white",
  padding:"18px",
  boxShadow:"0 20px 40px rgba(0,0,0,0.12)",
  borderRadius:"4px",
  transform:"rotate(-2deg)"
}}>

<div style={{ position: "relative", width: "100%", height: "240px", marginBottom: "10px" }}>
  <Image
    src="/story1.jpg"
    alt="Donde todo comenzó"
    fill
    sizes="(max-width: 768px) 100vw, 400px"
    className="object-cover rounded-[6px]"
  />
</div>

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
<div 
  data-aos="fade-left"
  style={{
    display:"flex",
    justifyContent:"flex-end",
    marginBottom:"80px",
    padding:"0 20px"
  }}
>
<div style={{
  width:"45%",
  paddingRight:"40px",
  background:"white",
  padding:"18px",
  boxShadow:"0 20px 40px rgba(0,0,0,0.12)",
  borderRadius:"4px",
  transform:"rotate(2deg)"
}}>
<div style={{ position: "relative", width: "100%", height: "240px", marginBottom: "10px" }}>
  <Image
    src="/story2.jpg"
    alt="Nuestro primer viaje juntos"
    fill
    sizes="(max-width: 768px) 100vw, 400px"
    className="object-cover rounded-[6px]"
  />
</div>

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
<div 
  data-aos="fade-right"
  style={{
    display:"flex",
    justifyContent:"flex-start"
  }}
>
<div style={{
  width:"45%",
  background:"white",
  padding:"20px",
  boxShadow:"0 10px 25px rgba(0,0,0,0.08)",
  borderRadius:"8px"
}}>

<div style={{ position: "relative", width: "100%", height: "240px", marginBottom: "10px" }}>
  <Image
    src="/story3.jpg"
    alt="La propuesta"
    fill
    sizes="(max-width: 768px) 100vw, 400px"
    className="object-cover rounded-[6px]"
  />
</div>

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

<MusicPlayer />

<Gallery />

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


{/* CÓDIGO DE VESTIMENTA */}
<section id="vestimenta" className="section-light" style={{ textAlign: "center", position: "relative" }}>
  <div className="divider"></div>

  <h2 
    className="tracking-[6px] font-light uppercase text-[clamp(26px,5vw,40px)] mb-5 text-[#3b2b20]"
    style={{ fontFamily: "var(--font-elegant)" }}
  >
    Código de Vestimenta
  </h2>

  <p 
    className="mb-8 tracking-[0.3px] text-[20px] text-[#8a8178] max-w-[700px] mx-auto leading-relaxed px-4"
    style={{ fontFamily: "var(--font-elegant)" }}
  >
    Para acompañarnos en este gran día, les sugerimos un estilo <strong style={{ color: "#3b2b20", fontWeight: 400 }}>Formal Campestre</strong>.
  </p>

  <div style={{
    maxWidth: "900px",
    margin: "40px auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "40px",
    padding: "0 20px"
  }}>
    {/* DAMAS */}
    <div style={{
      background: "white",
      padding: "28px",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
      border: "1px solid #e5e0d8"
    }}>
      <span className="text-3xl">👗</span>
      <h3 
        className="text-lg uppercase tracking-[2px] text-[#3b2b20] mt-3 mb-3"
        style={{ fontFamily: "var(--font-elegant)" }}
      >
        Damas
      </h3>
      <p 
        className="text-sm text-[#8a8178] leading-relaxed"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Vestido largo formal o midi, en telas frescas y fluidas con caída elegante (como satín, seda, lino o crepé). Sugerimos colores inspirados en la naturaleza: tonos tierra, oliva, salvia, terracota, ocre o rosa empolvado. <br />
        <span className="text-xs italic text-[#C7A27C] block mt-1.5">* Se solicita evitar el uso de blanco, marfil, crema o azul.</span>
      </p>
    </div>

    {/* CABALLEROS */}
    <div style={{
      background: "white",
      padding: "28px",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
      border: "1px solid #e5e0d8"
    }}>
      <span className="text-3xl">👔</span>
      <h3 
        className="text-lg uppercase tracking-[2px] text-[#3b2b20] mt-3 mb-3"
        style={{ fontFamily: "var(--font-elegant)" }}
      >
        Caballeros
      </h3>
      <p 
        className="text-sm text-[#8a8178] leading-relaxed"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Traje formal de lino o algodón en tonos claros (como beige, arena o azul claro), o guayabera blanca de manga larga con pantalón de vestir de tono neutro y calzado tipo mocasín.
      </p>
    </div>
  </div>

  {/* PALETA DE COLORES */}
  <div style={{ margin: "50px auto 30px auto", maxWidth: "750px" }}>
    <h4 
      className="text-xs uppercase tracking-[3px] text-[#8a8178] mb-6 font-bold"
      style={{ fontFamily: "var(--font-elegant)" }}
    >
      Paleta de Colores Sugerida
    </h4>
    <div className="flex justify-center gap-5 flex-wrap px-4">
      {[
        { color: "#F4C2C2", name: "Blush Pink" },
        { color: "#8F9E8B", name: "Sage Green" },
        { color: "#79806C", name: "Salvia" },
        { color: "#F9F6EE", name: "Ivory" },
        { color: "#E6E6FA", name: "Lavender" },
        { color: "#E5E4E2", name: "Light Grey" },
        { color: "#BDFCC9", name: "Mint Green" },
        { color: "#FDF6E2", name: "Cream" },
        { color: "#E1D7C6", name: "Beige" },
        { color: "#FFE5B4", name: "Peach" },
        { color: "#F7E5A9", name: "Butter Yellow" },
        { color: "#DCD0FF", name: "Lilac" },
        { color: "#D09E9E", name: "Dusty Rose" },
        { color: "#A9D39E", name: "Pistachio Green" }
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 group cursor-help" style={{ minWidth: "80px" }}>
          <div 
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              backgroundColor: item.color,
              border: "2px solid white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              transition: "transform 0.3s ease"
            }}
            className="hover:scale-110"
          />
          <span className="text-[9px] tracking-[0.5px] text-[#8a8178] uppercase text-center" style={{ fontFamily: "var(--font-elegant)" }}>
            {item.name}
          </span>
        </div>
      ))}
    </div>
  </div>

  {/* GALERÍA DE INSPIRACIÓN */}
  <div style={{ marginTop: "60px", padding: "0 20px" }}>
    <h4 
      className="text-xs uppercase tracking-[3px] text-[#8a8178] mb-6 font-bold"
      style={{ fontFamily: "var(--font-elegant)" }}
    >
      Inspiraciones de Vestuario
    </h4>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 max-w-[1150px] mx-auto">
      {[
        { src: "/codigo2.jpeg", label: "Inspiración 1" },
        { src: "/codigo5.jpeg", label: "Inspiración 2" },
        { src: "/codigo3.jpeg", label: "Inspiración 3" },
        { src: "/codigo4.jpeg", label: "Inspiración 4" },
        { src: "/codigo6.jpeg", label: "Inspiración 5" }
      ].map((img, i) => (
        <div 
          key={i}
          className="relative w-full h-[340px] rounded-lg overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-[#e5e0d8] group"
        >
          <Image
            src={img.src}
            alt={img.label}
            fill
            sizes="(max-width: 640px) 50vw, 250px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ))}
    </div>
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
lineHeight:"1.8",
color:"#e6ddd5"
}}>
Cuenta corriente: <strong style={{color:"#fff"}}>816921621</strong>
<button
  onClick={() => handleCopyAccount("816921621")}
  style={{
    marginLeft: "10px",
    background: "none",
    border: `1px solid ${copiedText === "816921621" ? "#a8c3a0" : "rgba(199, 162, 124, 0.4)"}`,
    color: copiedText === "816921621" ? "#a8c3a0" : "#c7a27c",
    cursor: "pointer",
    fontSize: "11px",
    fontFamily: "var(--font-elegant)",
    letterSpacing: "1px",
    padding: "3px 10px",
    borderRadius: "15px",
    transition: "all 0.25s ease"
  }}
>
  {copiedText === "816921621" ? "¡Copiado! ✓" : "📋 Copiar"}
</button>
<br/>
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
lineHeight:"1.8",
color:"#e6ddd5"
}}>
Cuenta de ahorro: <strong style={{color:"#fff"}}>34139820016</strong>
<button
  onClick={() => handleCopyAccount("34139820016")}
  style={{
    marginLeft: "10px",
    background: "none",
    border: `1px solid ${copiedText === "34139820016" ? "#a8c3a0" : "rgba(199, 162, 124, 0.4)"}`,
    color: copiedText === "34139820016" ? "#a8c3a0" : "#c7a27c",
    cursor: "pointer",
    fontSize: "11px",
    fontFamily: "var(--font-elegant)",
    letterSpacing: "1px",
    padding: "3px 10px",
    borderRadius: "15px",
    transition: "all 0.25s ease"
  }}
>
  {copiedText === "34139820016" ? "¡Copiado! ✓" : "📋 Copiar"}
</button>
<br/>
Titular: Ailyn Santana
</p>

</div>

{/* DIVIDER */}
<div style={{
width:"40px",
height:"1px",
background:"#c7a27c"
}}/>

{/* CUENTA 3 */}
<div>
<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"3px",
fontSize:"15px",
opacity:0.7,
marginBottom:"10px"
}}>
BANRESERVAS
</p>

<p style={{
fontFamily:"var(--font-body)",
lineHeight:"1.8",
color:"#e6ddd5"
}}>
Cuenta de ahorro: <strong style={{color:"#fff"}}>9606316788</strong>
<button
  onClick={() => handleCopyAccount("9606316788")}
  style={{
    marginLeft: "10px",
    background: "none",
    border: `1px solid ${copiedText === "9606316788" ? "#a8c3a0" : "rgba(199, 162, 124, 0.4)"}`,
    color: copiedText === "9606316788" ? "#a8c3a0" : "#c7a27c",
    cursor: "pointer",
    fontSize: "11px",
    fontFamily: "var(--font-elegant)",
    letterSpacing: "1px",
    padding: "3px 10px",
    borderRadius: "15px",
    transition: "all 0.25s ease"
  }}
>
  {copiedText === "9606316788" ? "¡Copiado! ✓" : "📋 Copiar"}
</button>
<br/>
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
textAlign:"center"
}}>
Preguntas frecuentes
</h2>

<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"4px",
textTransform:"uppercase",
fontSize:"11px",
color:"#8a8178",
textAlign:"center",
marginBottom:"35px"
}}>
Toca cada pregunta para ver más información
</p>

<div style={{
maxWidth:"700px",
margin:"40px auto",
display:"flex",
flexDirection:"column",
gap:"20px"
}}>

{[
{
q:"¿A qué hora empieza la ceremonia?",
a:"La ceremonia comenzará a las 3:30 PM. Les recomendamos llegar unos minutos antes."
},
{
q:"¿Se permiten niños?",
a:"Hemos decidido que nuestra boda sea una celebración solo para adultos."
},
{
q:"¿Puedo llevar un acompañante?",
a:"Debido a la capacidad del evento, las invitaciones no incluyen acompañante adicional."
}
].map((item,index)=>(

<div
key={index}
style={{
borderBottom:"1px solid #ddd5cc",
paddingBottom:"20px"
}}
>

<div
onClick={()=>setOpenFAQ(openFAQ === index ? null : index)}
style={{
display:"flex",
justifyContent:"space-between",
cursor:"pointer"
}}
>
<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"2px",
fontSize:"13px"
}}>
{item.q}
</p>

<span>
{openFAQ === index ? "−" : "+"}
</span>
</div>

<div
  style={{
    maxHeight: openFAQ === index ? "120px" : "0px",
    opacity: openFAQ === index ? 1 : 0,
    overflow: "hidden",
    transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease, margin-top 0.4s ease",
    marginTop: openFAQ === index ? "15px" : "0px"
  }}
>
  <p style={{
    fontFamily:"var(--font-elegant)",
    lineHeight:"1.8",
    color:"#5a5048"
  }}>
    {item.a}
  </p>
</div>

</div>

))}

</div>

</section>

{/* RSVP */}
<RSVPForm
  guestId={guestId}
  guestName={guestName}
  isValidGuest={isValidGuest}
  alreadyAnswered={alreadyAnswered}
  setAlreadyAnswered={setAlreadyAnswered}
/>

{/* FOOTER FINAL */}

<section style={{
padding:"100px 20px",
textAlign:"center",
background:"#3A2A23",
color:"white"
}}>

<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
textTransform:"uppercase",
fontSize:"12px",
opacity:"0.8",
marginBottom:"20px"
}}>
Gracias por ser parte de nuestra historia
</p>

<p style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"6px",
textTransform:"uppercase",
fontSize:"12px",
opacity:"0.8",
marginBottom:"20px"
}}>
Nos vemos el 12 de diciembre de 2026
</p>

<h2 style={{
fontFamily:"var(--font-elegant)",
letterSpacing:"4px",
fontWeight:300,
fontSize:"24px",
marginTop:"40px"
}}>
Luis & Ailyn
</h2>

<div style={{
width:"60px",
height:"1px",
background:"#c7a27c",
margin:"40px auto 0 auto"
}}/>

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