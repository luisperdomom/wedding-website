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
const [guestAttendingChoice, setGuestAttendingChoice] = useState<string | null>(null)
const [isExpired, setIsExpired] = useState(false)
const [isPlural, setIsPlural] = useState(false)
const [primaryName, setPrimaryName] = useState("")
const [companionName, setCompanionName] = useState("")

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
          setPrimaryName(guestData.name)
          if (guestData.companion && guestData.companion.trim()) {
            const compName = guestData.companion.trim()
            setCompanionName(compName)
            const firstChar = compName.toLowerCase()
            const startsWithI = firstChar.startsWith("i")
            const startsWithHi = firstChar.startsWith("hi") && !firstChar.startsWith("hie")
            
            const conjunction = (startsWithI || startsWithHi) ? " e " : " y "
            setGuestName(`${guestData.name}${conjunction}${compName}`)
            setIsPlural(true)
          } else {
            setGuestName(guestData.name)
            setIsPlural(false)
            setCompanionName("")
          }
          setIsValidGuest(true)

          // Verificar si ha expirado la invitación (validez de 7 días)
          if (guestData.createdAt) {
            const createdTime = guestData.createdAt.toDate 
              ? guestData.createdAt.toDate().getTime() 
              : new Date(guestData.createdAt).getTime()
              
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
            const isExpiredTime = Date.now() > (createdTime + sevenDaysInMs)
            setIsExpired(isExpiredTime)
          }

          // Verificar si ya tiene respuesta registrada
          const q = query(
            collection(db, "rsvp"),
            where("guestId", "==", guestId)
          )
          const snapshot = await getDocs(q)
          if (!snapshot.empty) {
            setAlreadyAnswered(true)
            const rsvpData = snapshot.docs[0].data()
            setGuestAttendingChoice(rsvpData.attending)
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

<a href="#regalos" onClick={()=>setMenuOpen(false)}>Regalos</a>

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
  background:"#f5f1ea",
  position: "relative"
}}
>

  <div 
    style={{
      maxWidth: "650px",
      margin: "0 auto",
      background: "white",
      padding: "60px 40px",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(58, 42, 35, 0.03)",
      border: "1px solid rgba(199, 162, 124, 0.2)",
      position: "relative",
      overflow: "hidden"
    }}
  >
    {/* Inset Border Frame */}
    <div style={{
      position: "absolute",
      inset: "8px",
      border: "1px solid rgba(199, 162, 124, 0.1)",
      borderRadius: "10px",
      pointerEvents: "none"
    }} />

    {/* Dynamic Guest Greeting (Calligraphy de Ultra Lujo - Pinyon Script) */}
    {guestName && (
      <p 
        style={{
          fontFamily: "var(--font-pinyon)",
          fontSize: "clamp(30px, 6.5vw, 48px)",
          color: "#c7a27c",
          marginBottom: "15px",
          lineHeight: "1.1",
          fontWeight: 300,
          letterSpacing: "1.5px",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          opacity: 0.95
        }}
      >
        {guestName}
      </p>
    )}

    <h2 style={{
      fontFamily: "var(--font-elegant)",
      letterSpacing: "6px",
      fontWeight: 300,
      textTransform: "uppercase",
      fontSize: "clamp(20px, 3vw, 28px)",
      color: "#3a2a23",
      marginBottom: "25px"
    }}>
      Estás invitado
    </h2>

    <p style={{
      marginBottom: "0px",
      letterSpacing: "0.3px",
      fontSize: "15px",
      color: "#6b635b",
      fontFamily: "var(--font-body)",
      lineHeight: "1.8",
      maxWidth: "500px",
      margin: "0 auto"
    }}>
      {isPlural ? (
        <>
          Nos llena de alegría que estén aquí y que formen parte de este momento tan especial en nuestras vidas. Hemos creado este espacio para compartir con ustedes todos los detalles de nuestra boda.
          <br /><br />
          Gracias por acompañarnos en el inicio de esta nueva etapa juntos.
        </>
      ) : (
        <>
          Nos llena de alegría que estés aquí y que formes parte de este momento tan especial en nuestras vidas. Hemos creado este espacio para compartir contigo todos los detalles de nuestra boda.
          <br /><br />
          Gracias por acompañarnos en el inicio de esta nueva etapa juntos.
        </>
      )}
    </p>

    {/* Subtle Decorative Flower inside the card */}
    <div style={{ position: "absolute", right: "-80px", bottom: "-80px", width: "220px", height: "220px", opacity: 0.35, pointerEvents: "none" }}>
      <Image
        src="/floral.png"
        alt=""
        fill
        sizes="220px"
        className="object-contain"
      />
    </div>
  </div>

  {/* Signature at the bottom */}
  <p style={{
    fontFamily: "var(--font-elegant)",
    letterSpacing: "4px",
    fontWeight: 300,
    fontSize: "22px",
    marginTop: "40px",
    color: "#3a2a23"
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
  maxWidth: "1050px",
  margin: "60px auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "50px",
  alignItems: "center",
  padding: "0 24px"
}}>

  {/* COLUMNA 1: RETRATO DE LA PAREJA (FOTO PRINCIPAL) */}
  <div 
    data-aos="fade-right"
    style={{
      position: "relative",
      width: "100%",
      height: "540px",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 15px 40px rgba(58, 42, 35, 0.08)",
      border: "1px solid rgba(199, 162, 124, 0.15)"
    }}
  >
    <Image
      src="/Couple.jpg"
      alt="Luis & Ailyn"
      fill
      className="object-cover"
      priority
    />
  </div>

  {/* COLUMNA 2: TEXTO DE NUESTRA HISTORIA */}
  <div style={{ textAlign: "left" }}>
    
    {/* ICONO VECTORIAL - DESTINOS CRUZADOS */}
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#c7a27c" strokeWidth="1.2" style={{ marginBottom: "25px", opacity: 0.8, display: "block" }}>
      <path d="M5 20C15 20 20 15 20 5" />
      <path d="M5 20C15 20 20 25 20 35" />
      <path d="M35 20C25 20 20 15 20 5" />
      <path d="M35 20C25 20 20 25 20 35" />
      <circle cx="20" cy="20" r="2" fill="#c7a27c" />
    </svg>

    {/* PÁRRAFO 1 - CON LETRA CAPITAL (DROP CAP) */}
    <p 
      data-aos="fade-up"
      data-aos-delay="0"
      style={{
        marginBottom:"35px",
        letterSpacing:"0.3px",
        fontSize:"16px",
        color:"#5a5048",
        fontFamily:"var(--font-serif)",
        lineHeight:"2.1",
        textAlign: "justify"
      }}
    >
      <span style={{
        float: "left",
        fontFamily: "var(--font-serif)",
        fontSize: "65px",
        lineHeight: "45px",
        paddingTop: "6px",
        paddingRight: "10px",
        color: "#c7a27c",
        fontWeight: 300
      }}>N</span>
      uestra historia comenzó en el lugar menos pensado: el pasillo de un call center. Todo empezó con una pregunta de lo más simple para coordinar la hora de un almuerzo, una excusa que Luis encontró para hablar con Ailyn por primera vez.
    </p>

    {/* PÁRRAFO 2 */}
    <p 
      data-aos="fade-up"
      data-aos-delay="200"
      style={{
        marginBottom:"35px",
        letterSpacing:"0.3px",
        fontSize:"16px",
        color:"#5a5048",
        fontFamily:"var(--font-serif)",
        lineHeight:"2.1",
        textAlign: "justify"
      }}
    >
      Esa primera conversación casual se convirtió en risas del día a día, luego en una bonita amistad y, con el tiempo, en el amor más sincero de nuestras vidas.
    </p>

    {/* PÁRRAFO 3 */}
    <p 
      data-aos="fade-up"
      data-aos-delay="400"
      style={{
        marginBottom:"0px",
        letterSpacing:"0.3px",
        fontSize:"16px",
        color:"#5a5048",
        fontFamily:"var(--font-serif)",
        lineHeight:"2.1",
        textAlign: "justify"
      }}
    >
      Desde entonces, hemos compartido viajes, retos y un sinfín de momentos inolvidables. Hoy, estamos listos para dar el paso más importante y comenzar una nueva etapa juntos.
    </p>

  </div>
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

<div className="relative max-w-[900px] mx-auto px-4 md:px-5">

  {/* Línea vertical central (responsiva) */}
  <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-[1px] bg-[#e4ddd4] -translate-x-1/2" />

  {/* EVENTO 1 (2017) */}
  <div 
    data-aos="fade-right"
    className="relative flex justify-start mb-16 pl-8 sm:pl-0 sm:justify-start"
  >
    {/* Bullet Node */}
    <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 top-8 w-3 h-3 rounded-full bg-[#c9a27e] border-2 border-[#f6f3ee] z-10" />

    <div className="w-full sm:w-[45%] sm:rotate-[-1.5deg] hover:rotate-0 hover:scale-[1.02] transition-all duration-300 bg-white p-5 shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-[#e5e0d8] rounded-xl text-left">
      <div style={{ position: "relative", width: "100%", height: "auto", marginBottom: "15px" }}>
        <img
          src="/story1.jpg"
          alt="2017 · El inicio de todo"
          style={{ width: "100%", height: "auto", borderRadius: "8px", display: "block" }}
          loading="lazy"
        />
      </div>

      <h3 style={{
        fontFamily:"var(--font-elegant)",
        letterSpacing:"3px",
        fontSize:"18px",
        fontWeight:300,
        color:"#3b2b20",
        marginBottom: "8px"
      }}>
        2017 · El inicio de todo
      </h3>

      <p style={{
        fontFamily:"var(--font-body)",
        color:"#6b635b",
        fontSize: "14px",
        lineHeight:"1.6"
      }}>
        El año en que empezamos a escribir nuestro camino y a vivir nuestros primeros momentos llenos de risas y complicidad.
      </p>
    </div>
  </div>

  {/* EVENTO 2 (2024 - VIAJE) */}
  <div 
    data-aos="fade-left"
    className="relative flex justify-start pl-8 sm:pl-0 sm:justify-end mb-16"
  >
    {/* Bullet Node */}
    <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 top-8 w-3 h-3 rounded-full bg-[#c9a27e] border-2 border-[#f6f3ee] z-10" />

    <div className="w-full sm:w-[45%] sm:rotate-[1.5deg] hover:rotate-0 hover:scale-[1.02] transition-all duration-300 bg-white p-5 shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-[#e5e0d8] rounded-xl text-left">
      <div style={{ position: "relative", width: "100%", height: "auto", marginBottom: "15px" }}>
        <img
          src="/story2.jpg"
          alt="2024 · Coleccionando Destinos"
          style={{ width: "100%", height: "auto", borderRadius: "8px", display: "block" }}
          loading="lazy"
        />
      </div>

      <h3 style={{
        fontFamily:"var(--font-elegant)",
        letterSpacing:"3px",
        fontSize:"18px",
        fontWeight:300,
        color:"#3b2b20",
        marginBottom: "8px"
      }}>
        2024 · Coleccionando Destinos
      </h3>

      <p style={{
        fontFamily:"var(--font-body)",
        color:"#6b635b",
        fontSize: "14px",
        lineHeight:"1.6"
      }}>
        Nuestro primer viaje juntos fuera del país, el inicio de nuestra tradición favorita de recorrer el mundo de la mano.
      </p>
    </div>
  </div>

  {/* EVENTO 3 (2024 - PROPUESTA) */}
  <div 
    data-aos="fade-right"
    className="relative flex justify-start pl-8 sm:pl-0 sm:justify-start"
  >
    {/* Bullet Node */}
    <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 top-8 w-3 h-3 rounded-full bg-[#c9a27e] border-2 border-[#f6f3ee] z-10" />

    <div className="w-full sm:w-[45%] sm:rotate-[-1deg] hover:rotate-0 hover:scale-[1.02] transition-all duration-300 bg-white p-5 shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-[#e5e0d8] rounded-xl text-left">
      <div style={{ position: "relative", width: "100%", height: "auto", marginBottom: "15px" }}>
        <img
          src="/story3.jpg"
          alt="2024 · El Sí más esperado"
          style={{ width: "100%", height: "auto", borderRadius: "8px", display: "block" }}
          loading="lazy"
        />
      </div>

      <h3 style={{
        fontFamily:"var(--font-elegant)",
        letterSpacing:"3px",
        fontSize:"18px",
        fontWeight:300,
        color:"#3b2b20",
        marginBottom: "8px"
      }}>
        2024 · El "Sí" más esperado
      </h3>

      <p style={{
        fontFamily:"var(--font-body)",
        color:"#6b635b",
        fontSize: "14px",
        lineHeight:"1.6"
      }}>
        La propuesta. Un atardecer inolvidable que marcó el inicio del viaje definitivo de nuestras vidas.
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
padding:"110px 20px 60px 20px",
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

{/* BOTONES DE NAVEGACIÓN */}
<div style={{ display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap", marginTop: "25px" }}>
  <a
    href="https://www.google.com/maps/search/?api=1&query=Rancho+La+Vereda+San+Jose+de+Ocoa"
    target="_blank"
    className="button"
    style={{
      background: "transparent",
      border: "1px solid #c7a27c",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      fontFamily: "var(--font-elegant)",
      letterSpacing: "1px",
      cursor: "pointer",
      textDecoration: "none"
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c7a27c" }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
    Abrir en Google Maps
  </a>

  <a
    href="https://waze.com/ul?q=Rancho+La+Vereda+San+Jose+de+Ocoa"
    target="_blank"
    className="button"
    style={{
      background: "transparent",
      border: "1px solid #c7a27c",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      fontFamily: "var(--font-elegant)",
      letterSpacing: "1px",
      cursor: "pointer",
      textDecoration: "none"
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c7a27c" }}>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
    Abrir en Waze
  </a>
</div>

<p style={{
  marginTop: "18px",
  fontSize: "14px",
  fontFamily: "var(--font-body)",
  color: "#e6ddd5",
  opacity: 0.85,
  fontStyle: "italic"
}}>
  Habrá estacionamiento disponible en el lugar. Nuestro equipo estará listo para guiarte al llegar.
</p>

{/* WIDGET DE CLIMA */}
<div style={{
  margin: "40px auto 0 auto",
  maxWidth: "500px",
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(199, 162, 124, 0.2)",
  borderRadius: "12px",
  padding: "20px 24px",
  display: "flex",
  alignItems: "center",
  gap: "18px",
  textAlign: "left"
}}>
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c7a27c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M6.34 17.66l-1.41 1.41M12 20v2M17.66 17.66l1.41 1.41M22 12h-2M19.07 4.93l-1.41 1.41" />
    <path d="M17 17.5A5 5 0 0 0 13 9h-1.5a5.5 5 0 0 0-10.5 2.5A4.5 4.5 0 0 0 5.5 16H16.5" style={{ fill: "rgba(199,162,124,0.1)" }} />
  </svg>
  <div>
    <h4 style={{
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "2px",
      color: "#c7a27c",
      fontFamily: "var(--font-elegant)",
      marginBottom: "4px",
      fontWeight: "bold"
    }}>
      Clima en Ocoa
    </h4>
    <p style={{
      fontSize: "13px",
      fontFamily: "var(--font-body)",
      color: "#e6ddd5",
      lineHeight: "1.5"
    }}>
      San José de Ocoa se caracteriza por un agradable clima de montaña (entre 18°C y 24°C al atardecer). Les sugerimos traer un abrigo ligero para la noche.
    </p>
  </div>
</div>

{/* PROGRAMA DE LA BODA */}
<div style={{ marginTop: "80px" }}>
  <h3 style={{
    fontFamily: "var(--font-elegant)",
    letterSpacing: "4px",
    textTransform: "uppercase",
    fontSize: "20px",
    color: "#c7a27c",
    marginBottom: "40px"
  }}>
    Programa de la Boda
  </h3>

  <div style={{
    position: "relative",
    maxWidth: "500px",
    margin: "0 auto",
    paddingLeft: "30px",
    textAlign: "left"
  }}>
    {/* Línea vertical */}
    <div style={{
      position: "absolute",
      left: "9px",
      top: "10px",
      bottom: "10px",
      width: "1px",
      background: "rgba(199, 162, 124, 0.3)"
    }} />

    {[
      {
        time: "03:30 PM",
        title: "Ceremonia",
        desc: "La promesa de amor al aire libre.",
        icon: (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: "translateY(-1px)" }}>
            <circle cx="8" cy="12" r="5" />
            <circle cx="16" cy="12" r="5" />
          </svg>
        )
      },
      {
        time: "04:30 PM",
        title: "Coctel",
        desc: "Brindis, música suave y sesión de fotos con los novios.",
        icon: (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: "translateY(-1px)" }}>
            <path d="M12 2v10m0 0a5 5 0 0 1-5-5h10a5 5 0 0 1-5 5zm0 10h-6m6 0h6" />
          </svg>
        )
      },
      {
        time: "06:00 PM",
        title: "Banquete",
        desc: "Cena formal para celebrar juntos.",
        icon: (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: "translateY(-1px)" }}>
            <path d="M18 2v20M15 2v6a3 3 0 0 0 6 0V2M12 2v20" />
          </svg>
        )
      },
      {
        time: "07:30 PM",
        title: "¡Que empiece la fiesta!",
        desc: "Baile, diversión y momentos mágicos.",
        icon: (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: "translateY(-1px)" }}>
            <path d="M9 18V5l12-2v13M9 9l12-2" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        )
      }
    ].map((step, index) => (
      <div key={index} style={{ position: "relative", marginBottom: "35px" }}>
        {/* Nodo */}
        <div style={{
          position: "absolute",
          left: "-29px",
          top: "3px",
          width: "19px",
          height: "19px",
          borderRadius: "50%",
          background: "#3A2A23",
          border: "1px solid #c7a27c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#c7a27c"
        }}>
          {step.icon}
        </div>

        <div>
          <span style={{
            fontSize: "11px",
            fontFamily: "var(--font-elegant)",
            letterSpacing: "1.5px",
            color: "#c7a27c",
            fontWeight: "bold",
            display: "block"
          }}>
            {step.time}
          </span>
          <h4 style={{
            fontSize: "15px",
            fontFamily: "var(--font-elegant)",
            letterSpacing: "1px",
            color: "#fff",
            marginTop: "2px",
            marginBottom: "4px"
          }}>
            {step.title}
          </h4>
          <p style={{
            fontSize: "13px",
            fontFamily: "var(--font-body)",
            color: "#e6ddd5"
          }}>
            {step.desc}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>

</div>

</section>

{/* WHERE TO STAY */}

<section className="section-dark !py-24">

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
  marginBottom:"40px",
  letterSpacing:"0.3px",
  fontSize:"18px",
  color:"#e6ddd5",
  fontFamily:"var(--font-serif)",
  fontStyle: "italic",
  maxWidth: "700px",
  margin: "0 auto 50px auto",
  lineHeight: "1.6",
  padding: "0 20px"
}}>
  "San José de Ocoa tiene rincones hermosos para descansar. Si desean quedarse en el pueblo durante el fin de semana para celebrar con calma, les compartimos algunas de nuestras opciones de hospedaje favoritas y cercanas al lugar del evento.<br /><br />
  La disponibilidad en la montaña suele ser limitada, por lo que les sugerimos reservar con la mayor anticipación posible."
</p>

{/* GRID DE TARJETAS DE HOSPEDAJE */}
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "30px",
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "0 20px"
}}>

  {/* OPCIÓN 1: Entire Home */}
  <div style={{
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(199, 162, 124, 0.15)",
    borderRadius: "16px",
    padding: "30px 24px",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "260px"
  }} className="hover:scale-[1.02] transition-all duration-300">
    <div>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c7a27c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "15px" }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      <h3 style={{ fontFamily: "var(--font-elegant)", fontSize: "18px", letterSpacing: "2px", color: "#fff", marginBottom: "6px", fontWeight: 300 }}>
        Residencia Completa
      </h3>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#e6ddd5", lineHeight: "1.5", marginBottom: "8px" }}>
        Casa de montaña espaciosa y acogedora en San José de Ocoa. Ideal para disfrutar en familia o en grupos de amigos con total privacidad.
      </p>

      {/* Specs bar for Option 1 */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "8px", 
        marginBottom: "18px",
        fontSize: "11px",
        color: "#c7a27c",
        fontFamily: "var(--font-elegant)",
        letterSpacing: "0.5px"
      }}>
        <span>👥 5 huéspedes</span>
        <span>·</span>
        <span>🚪 2 habs</span>
        <span>·</span>
        <span>🛏️ 2 camas</span>
        <span>·</span>
        <span>🚿 1 baño</span>
      </div>
    </div>
    <a
      href="https://www.airbnb.com/rooms/1578611592370803713?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1773350534_P3tlWpq0WhEHqmon&previous_page_section_name=1000&federated_search_id=737daf10-e7c6-4653-aad5-572a1891177a"
      target="_blank"
      className="button button-light"
      style={{
        textAlign:"center",
        fontFamily:"var(--font-elegant)",
        letterSpacing:"2px",
        fontSize:"12px",
        width: "100%",
        padding: "10px 0"
      }}
    >
      Ver en Airbnb
    </a>
  </div>

  {/* OPCIÓN 2: Entire Cottage */}
  <div style={{
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(199, 162, 124, 0.15)",
    borderRadius: "16px",
    padding: "30px 24px",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "260px"
  }} className="hover:scale-[1.02] transition-all duration-300">
    <div>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c7a27c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "15px" }}>
        <path d="M12 2L2 12h3v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8h3L12 2z" />
      </svg>
      <h3 style={{ fontFamily: "var(--font-elegant)", fontSize: "18px", letterSpacing: "2px", color: "#fff", marginBottom: "6px", fontWeight: 300 }}>
        Cabaña de Ocoa
      </h3>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#e6ddd5", lineHeight: "1.5", marginBottom: "8px" }}>
        Cabaña rústica privada rodeada de la hermosa naturaleza de Ocoa. Una experiencia campestre auténtica y muy tranquila.
      </p>

      {/* Specs bar for Option 2 */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "8px", 
        marginBottom: "18px",
        fontSize: "11px",
        color: "#c7a27c",
        fontFamily: "var(--font-elegant)",
        letterSpacing: "0.5px"
      }}>
        <span>👥 5 huéspedes</span>
        <span>·</span>
        <span>🚪 2 habs</span>
        <span>·</span>
        <span>🛏️ 2 camas</span>
        <span>·</span>
        <span>🚿 2 baños</span>
      </div>
    </div>
    <a
      href="https://www.airbnb.com/rooms/45363133?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1773350244_P3CRes561-lpuuBH&previous_page_section_name=1000&federated_search_id=19bfe742-2ed3-44e2-88d5-4bf9ba9e8b3a"
      target="_blank"
      className="button button-light"
      style={{
        textAlign:"center",
        fontFamily:"var(--font-elegant)",
        letterSpacing:"2px",
        fontSize:"12px",
        width: "100%",
        padding: "10px 0"
      }}
    >
      Ver en Airbnb
    </a>
  </div>

  {/* OPCIÓN 3: Entire Rental Unit */}
  <div style={{
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(199, 162, 124, 0.15)",
    borderRadius: "16px",
    padding: "30px 24px",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "260px"
  }} className="hover:scale-[1.02] transition-all duration-300">
    <div>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c7a27c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "15px" }}>
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="9" y1="22" x2="9" y2="16" />
        <line x1="15" y1="22" x2="15" y2="16" />
        <line x1="9" y1="16" x2="15" y2="16" />
        <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
      </svg>
      <h3 style={{ fontFamily: "var(--font-elegant)", fontSize: "18px", letterSpacing: "2px", color: "#fff", marginBottom: "6px", fontWeight: 300 }}>
        Apartamento Privado
      </h3>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#e6ddd5", lineHeight: "1.5", marginBottom: "8px" }}>
        Unidad de apartamento moderna, confortable y completamente amueblada en el pueblo de San José de Ocoa. Práctico y seguro.
      </p>

      {/* Specs bar for Option 3 */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "8px", 
        marginBottom: "18px",
        fontSize: "11px",
        color: "#c7a27c",
        fontFamily: "var(--font-elegant)",
        letterSpacing: "0.5px"
      }}>
        <span>👥 6 huéspedes</span>
        <span>·</span>
        <span>🚪 3 habs</span>
        <span>·</span>
        <span>🛏️ 3 camas</span>
        <span>·</span>
        <span>🚿 2 baños</span>
      </div>
    </div>
    <a
      href="https://www.airbnb.com/rooms/1574242168305632524?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1773350244_P37Gxra0V44o2pTh&previous_page_section_name=1000&federated_search_id=19bfe742-2ed3-44e2-88d5-4bf9ba9e8b3a"
      target="_blank"
      className="button button-light"
      style={{
        textAlign:"center",
        fontFamily:"var(--font-elegant)",
        letterSpacing:"2px",
        fontSize:"12px",
        width: "100%",
        padding: "10px 0"
      }}
    >
      Ver en Airbnb
    </a>
  </div>

  {/* OPCIÓN 4: Entire Villa */}
  <div style={{
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(199, 162, 124, 0.15)",
    borderRadius: "16px",
    padding: "30px 24px",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "260px"
  }} className="hover:scale-[1.02] transition-all duration-300">
    <div>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c7a27c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "15px" }}>
        <path d="M2 22h20M4 6h16M3 10h18M4 6v4M20 6v4M6 10v12M18 10v12M12 10v12" />
        <path d="M12 2L2 6h20L12 2z" />
      </svg>
      <h3 style={{ fontFamily: "var(--font-elegant)", fontSize: "18px", letterSpacing: "2px", color: "#fff", marginBottom: "6px", fontWeight: 300 }}>
        Villa de Gran Capacidad
      </h3>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#e6ddd5", lineHeight: "1.5", marginBottom: "8px" }}>
        Villa de lujo ideal para estancias de grupos familiares numerosos. Espaciosa, cómoda y totalmente equipada.
      </p>
      
      {/* Specs bar for Option 4 */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "8px", 
        marginBottom: "18px",
        fontSize: "11px",
        color: "#c7a27c",
        fontFamily: "var(--font-elegant)",
        letterSpacing: "0.5px"
      }}>
        <span>👥 14 huéspedes</span>
        <span>·</span>
        <span>🚪 5 habs</span>
        <span>·</span>
        <span>🛏️ 8 camas</span>
        <span>·</span>
        <span>🚿 4 baños</span>
      </div>
    </div>
    <a
      href="https://www.airbnb.com/rooms/589182501706365585?check_in=2026-12-12&check_out=2026-12-13&search_mode=regular_search&source_impression_id=p3_1782087645_P3Ep1uU2FCWVOIGA&previous_page_section_name=1000&federated_search_id=b7208d7b-e128-490a-b98f-d4c44b334468"
      target="_blank"
      className="button button-light"
      style={{
        textAlign:"center",
        fontFamily:"var(--font-elegant)",
        letterSpacing:"2px",
        fontSize:"12px",
        width: "100%",
        padding: "10px 0"
      }}
    >
      Ver en Airbnb
    </a>
  </div>

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
        { color: "#E6E6FA", name: "Lavender" },
        { color: "#E5E4E2", name: "Light Grey" },
        { color: "#BDFCC9", name: "Mint Green" },
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 max-w-[1250px] mx-auto">
      {[
        { src: "/codigo2.jpeg", label: "Inspiración 1" },
        { src: "/codigo5.jpeg", label: "Inspiración 2" },
        { src: "/codigo3.jpeg", label: "Inspiración 3" },
        { src: "/codigo6.jpeg", label: "Inspiración 4" },
        { src: "/codigo7.jpeg", label: "Inspiración 5" },
        { src: "/codigo4.jpeg", label: "Inspiración 6" }
      ].map((img, i) => (
        <div 
          key={i}
          className="relative w-full h-[340px] rounded-lg overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-[#e5e0d8] group"
        >
          <Image
            src={img.src}
            alt={img.label}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  </div>
</section>


{/* PLAYLIST */}

<section className="section-light !py-24" style={{textAlign:"center"}}>

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
  fontSize:"18px",
  color:"#8a8178",
  fontFamily:"var(--font-serif)",
  fontStyle: "italic",
  maxWidth: "650px",
  margin: "0 auto 30px auto",
  lineHeight: "1.6",
  padding: "0 20px"
}}>
  "La música tiene el poder de guardar recuerdos. Queremos crear una playlist que nos acompañe en nuestra nueva vida juntos; un espacio donde puedan dedicarnos una canción, compartir un tema que les recuerde a nosotros, o simplemente regalarnos una melodía para escuchar en el camino.<br /><br />
  Añadan sus canciones favoritas para que formen parte de nuestra banda sonora de amor."
</p>

{/* SPOTIFY EMBEDDED PLAYER */}
<div style={{
  margin: "0 auto 40px auto",
  width: "100%",
  maxWidth: "500px",
  padding: "8px",
  background: "#1c110c",
  borderRadius: "16px",
  border: "1px solid rgba(199, 162, 124, 0.2)",
  boxShadow: "0 15px 40px rgba(58, 42, 35, 0.05)"
}} data-aos="fade-up">
  <iframe
    src="https://open.spotify.com/embed/playlist/2da7zmucwCTjehbLgaBcxR?utm_source=generator&theme=0"
    width="100%"
    height="152"
    style={{ border: 0, borderRadius: "12px" }}
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    loading="lazy"
  />
</div>

<a
  href="https://open.spotify.com/playlist/2da7zmucwCTjehbLgaBcxR?si=5bae9463894248a5&pt=7b2020ccfe79c28e13b1b6f7b822ccd5"
  target="_blank"
  className="button button-dark"
  style={{
    fontFamily:"var(--font-elegant)",
    letterSpacing:"2px",
    fontSize:"13px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px"
  }}
>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "translateY(-0.5px)" }}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
  REGALAR UNA CANCIÓN
</a>

</section>

{/* REGALOS */}

<section id="regalos" className="section-dark !py-24" style={{textAlign:"center", position: "relative"}}>

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
  marginBottom:"35px",
  letterSpacing:"0.3px",
  fontSize:"18px",
  color:"#e6ddd5",
  fontFamily:"var(--font-serif)",
  fontStyle: "italic",
  maxWidth: "650px",
  margin: "0 auto 30px auto",
  lineHeight: "1.6",
  padding: "0 20px"
}}>
  "Su presencia en nuestra boda es, sin duda, el mayor regalo que podríamos recibir.<br /><br />
  Sin embargo, si desean tener un detalle adicional con nosotros para ayudarnos a comenzar nuestro nuevo hogar, les compartimos con mucha gratitud nuestras opciones de cuenta para regalos en efectivo."
</p>

{/* ICONO VECTORIAL - DETALLE DE REGALO */}
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c7a27c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "40px auto 10px auto", display: "block", opacity: 0.85 }}>
  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" style={{ fill: "rgba(199,162,124,0.05)" }} />
  <path d="M12 22V7M2 12h20" />
  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
</svg>

<p style={{
  fontFamily:"var(--font-elegant)",
  letterSpacing:"3px",
  fontSize:"15px",
  color: "#c7a27c",
  marginBottom: "35px"
}}>
  CUENTAS DE REGALOS
</p>

{/* TARJETA DE CUENTAS DE LUJO (STATIONERY CARD) */}
<div 
  style={{
    maxWidth: "550px",
    margin: "0 auto",
    background: "rgba(255, 255, 255, 0.02)",
    padding: "45px 25px",
    borderRadius: "16px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
    border: "1px solid rgba(199, 162, 124, 0.18)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "35px",
    alignItems: "center"
  }}
  data-aos="fade-up"
>
  {/* Inset Border Frame */}
  <div style={{
    position: "absolute",
    inset: "8px",
    border: "1px solid rgba(199, 162, 124, 0.08)",
    borderRadius: "10px",
    pointerEvents: "none"
  }} />

  {/* CUENTA 1 */}
  <div style={{ width: "100%", zIndex: 10 }}>
    <p style={{
      fontFamily:"var(--font-elegant)",
      letterSpacing:"3px",
      fontSize:"13px",
      color: "#c7a27c",
      marginBottom:"12px"
    }}>
      BANCO POPULAR
    </p>

    <p style={{
      fontFamily:"var(--font-body)",
      fontSize: "14px",
      lineHeight:"1.8",
      color:"#e6ddd5"
    }}>
      Cuenta corriente: <strong style={{color:"#fff", fontFamily: "monospace", fontSize: "15px"}}>816921621</strong>
      <button
        onClick={() => handleCopyAccount("816921621")}
        style={{
          marginLeft: "12px",
          background: "none",
          border: `1px solid ${copiedText === "816921621" ? "#a8c3a0" : "rgba(199, 162, 124, 0.3)"}`,
          color: copiedText === "816921621" ? "#a8c3a0" : "#c7a27c",
          cursor: "pointer",
          fontSize: "11px",
          fontFamily: "var(--font-elegant)",
          letterSpacing: "1px",
          padding: "3px 12px",
          borderRadius: "15px",
          transition: "all 0.25s ease",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px"
        }}
      >
        {copiedText === "816921621" ? (
          "¡Copiado! ✓"
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "translateY(-0.5px)" }}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copiar
          </>
        )}
      </button>
      <br/>
      Titular: Ailyn Santana
    </p>
  </div>

  {/* DIVIDER */}
  <div style={{
    width:"40px",
    height:"1px",
    background:"rgba(199, 162, 124, 0.25)",
    zIndex: 10
  }}/>

  {/* CUENTA 2 */}
  <div style={{ width: "100%", zIndex: 10 }}>
    <p style={{
      fontFamily:"var(--font-elegant)",
      letterSpacing:"3px",
      fontSize:"13px",
      color: "#c7a27c",
      marginBottom:"12px"
    }}>
      BHD
    </p>

    <p style={{
      fontFamily:"var(--font-body)",
      fontSize: "14px",
      lineHeight:"1.8",
      color:"#e6ddd5"
    }}>
      Cuenta de ahorro: <strong style={{color:"#fff", fontFamily: "monospace", fontSize: "15px"}}>34139820016</strong>
      <button
        onClick={() => handleCopyAccount("34139820016")}
        style={{
          marginLeft: "12px",
          background: "none",
          border: `1px solid ${copiedText === "34139820016" ? "#a8c3a0" : "rgba(199, 162, 124, 0.3)"}`,
          color: copiedText === "34139820016" ? "#a8c3a0" : "#c7a27c",
          cursor: "pointer",
          fontSize: "11px",
          fontFamily: "var(--font-elegant)",
          letterSpacing: "1px",
          padding: "3px 12px",
          borderRadius: "15px",
          transition: "all 0.25s ease",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px"
        }}
      >
        {copiedText === "34139820016" ? (
          "¡Copiado! ✓"
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "translateY(-0.5px)" }}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copiar
          </>
        )}
      </button>
      <br/>
      Titular: Ailyn Santana
    </p>
  </div>

  {/* DIVIDER */}
  <div style={{
    width:"40px",
    height:"1px",
    background:"rgba(199, 162, 124, 0.25)",
    zIndex: 10
  }}/>

  {/* CUENTA 3 */}
  <div style={{ width: "100%", zIndex: 10 }}>
    <p style={{
      fontFamily:"var(--font-elegant)",
      letterSpacing:"3px",
      fontSize:"13px",
      color: "#c7a27c",
      marginBottom:"12px"
    }}>
      BANRESERVAS
    </p>

    <p style={{
      fontFamily:"var(--font-body)",
      fontSize: "14px",
      lineHeight:"1.8",
      color:"#e6ddd5"
    }}>
      Cuenta de ahorro: <strong style={{color:"#fff", fontFamily: "monospace", fontSize: "15px"}}>9606316788</strong>
      <button
        onClick={() => handleCopyAccount("9606316788")}
        style={{
          marginLeft: "12px",
          background: "none",
          border: `1px solid ${copiedText === "9606316788" ? "#a8c3a0" : "rgba(199, 162, 124, 0.3)"}`,
          color: copiedText === "9606316788" ? "#a8c3a0" : "#c7a27c",
          cursor: "pointer",
          fontSize: "11px",
          fontFamily: "var(--font-elegant)",
          letterSpacing: "1px",
          padding: "3px 12px",
          borderRadius: "15px",
          transition: "all 0.25s ease",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px"
        }}
      >
        {copiedText === "9606316788" ? (
          "¡Copiado! ✓"
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "translateY(-0.5px)" }}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copiar
          </>
        )}
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
  maxWidth:"650px",
  margin:"40px auto 0 auto",
  display:"flex",
  flexDirection:"column",
  padding: "0 20px"
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
a:"Debido a la capacidad del evento, las invitaciones no incluyen acompañantes adicionales, a menos de ser indicado en la invitación."
}
].map((item,index)=>(

<div
  key={index}
  onClick={()=>setOpenFAQ(openFAQ === index ? null : index)}
  style={{
    background: "white",
    border: "1px solid #e5e0d8",
    borderRadius: "12px",
    padding: "20px 24px",
    boxShadow: "0 4px 15px rgba(58, 42, 35, 0.02)",
    transition: "all 0.3s ease",
    marginBottom: "15px",
    cursor: "pointer",
    textAlign: "left"
  }}
  className="hover:border-[#C7A27C] hover:shadow-[0_8px_25px_rgba(58,42,35,0.05)]"
>

  <div
    style={{
      display:"flex",
      justifyContent:"space-between",
      alignItems: "center"
    }}
  >
    <p style={{
      fontFamily:"var(--font-elegant)",
      letterSpacing:"1.5px",
      fontSize:"14px",
      color: "#3a2a23",
      margin: 0,
      fontWeight: 400
    }}>
      {item.q}
    </p>

    {/* Chevron SVG con Rotación de 180 grados suave */}
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#c7a27c" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{
        transform: openFAQ === index ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        flexShrink: 0,
        marginLeft: "15px"
      }}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </div>

  <div
    style={{
      maxHeight: openFAQ === index ? "120px" : "0px",
      opacity: openFAQ === index ? 1 : 0,
      overflow: "hidden",
      transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease, margin-top 0.4s ease",
      marginTop: openFAQ === index ? "12px" : "0px"
    }}
  >
    <p style={{
      fontFamily:"var(--font-body)",
      lineHeight:"1.7",
      color:"#6b635b",
      fontSize: "13.5px",
      margin: 0
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
  isExpired={isExpired}
  attendingChoice={guestAttendingChoice}
  primaryName={primaryName}
  companionName={companionName}
  isPlural={isPlural}
/>

{/* FOOTER FINAL */}

<section style={{
  padding: "110px 20px",
  textAlign: "center",
  background: "#1e140f",
  color: "white",
  position: "relative"
}}>
  {/* Monograma dorado de lujo con logotipo transparente (tamaño equilibrado de 105px) */}
  <div style={{
    position: "relative",
    width: "105px",
    height: "105px",
    borderRadius: "50%",
    border: "1px dashed rgba(199, 162, 124, 0.4)",
    margin: "0 auto 35px auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.01)"
  }}>
    <div style={{ position: "relative", width: "82px", height: "79px" }}>
      <Image
        src="/footer2.png"
        alt="Monograma Luis & Ailyn"
        fill
        className="object-contain"
        style={{ filter: "brightness(0) invert(1)", opacity: 0.95 }}
        priority
      />
    </div>
  </div>

  <p style={{
    fontFamily: "var(--font-serif)",
    fontStyle: "italic",
    fontSize: "18px",
    color: "#e6ddd5",
    maxWidth: "500px",
    margin: "0 auto 40px auto",
    opacity: 0.9,
    lineHeight: "1.6"
  }}>
    "Con amor, y la mayor ilusión de compartir este día junto a ti."
  </p>

  {/* Nombres en tipografía elegante original */}
  <h2 style={{
    fontFamily: "var(--font-elegant)",
    letterSpacing: "4px",
    textTransform: "uppercase",
    fontSize: "24px",
    fontWeight: 300,
    color: "#fff",
    margin: "0",
    marginTop: "40px"
  }}>
    Luis & Ailyn
  </h2>

  {/* Línea dorada de fecha */}
  <p style={{
    fontFamily: "var(--font-elegant)",
    letterSpacing: "4px",
    textTransform: "uppercase",
    fontSize: "11px",
    color: "#c7a27c",
    marginTop: "12px",
    fontWeight: "bold"
  }}>
    12 · 12 · 2026
  </p>

  <div style={{
    width: "40px",
    height: "1px",
    background: "rgba(199, 162, 124, 0.3)",
    margin: "40px auto 0 auto"
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