"use client"

import { useEffect, useState } from "react"
import { db } from "../../firebase"
import { collection, getDocs } from "firebase/firestore"

export default function Admin(){

const [guests,setGuests] = useState<any[]>([])

useEffect(()=>{

async function loadGuests(){

const snapshot = await getDocs(collection(db,"rsvp"))

const data:any[] = []

snapshot.forEach((doc)=>{
data.push(doc.data())
})

setGuests(data)

}

loadGuests()

},[])

const attending = guests.filter(g => g.attending === "Sí asistiré").length
const notAttending = guests.filter(g => g.attending === "No podré asistir").length
const total = guests.length

return(

<div style={{padding:"40px",fontFamily:"Arial"}}>

<h1>Panel de Invitados</h1>

<div style={{
display:"flex",
gap:"20px",
marginTop:"20px"
}}>

<div style={{
padding:"20px",
background:"#f5f5f5",
borderRadius:"10px"
}}>
<h3>Confirmados</h3>
<p>{attending}</p>
</div>

<div style={{
padding:"20px",
background:"#f5f5f5",
borderRadius:"10px"
}}>
<h3>No asistirán</h3>
<p>{notAttending}</p>
</div>

<div style={{
padding:"20px",
background:"#f5f5f5",
borderRadius:"10px"
}}>
<h3>Total respuestas</h3>
<p>{total}</p>
</div>

</div>

<table border={1} cellPadding={10} style={{marginTop:"30px"}}>

<thead>
<tr>
<th>Nombre</th>
<th>Asistencia</th>
</tr>
</thead>

<tbody>

{guests.map((g,i)=>(
<tr key={i}>
<td>{g.name}</td>
<td>{g.attending}</td>
</tr>
))}

</tbody>

</table>

</div>

)

}