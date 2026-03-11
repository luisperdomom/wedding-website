import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyBTxzhfCyy6-SASYclK79jF-1Ixql6sZhk",
    authDomain: "wedding-rsvp-88df0.firebaseapp.com",
    projectId: "wedding-rsvp-88df0",
    storageBucket: "wedding-rsvp-88df0.firebasestorage.app",
    messagingSenderId: "439518007601",
    appId: "1:439518007601:web:387581dad7578a9275a010",
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)