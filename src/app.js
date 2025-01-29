// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCjPEIpk3-MithVHsp3gZt1Dvec-LZ6tIk",
    authDomain: "emchfoundation.firebaseapp.com",
    projectId: "emchfoundation",
    storageBucket: "gs://emchfoundation.firebasestorage.app",
    messagingSenderId: "672690127773",
    appId: "1:672690127773:web:d011796fd7e3f601fb6574",
    measurementId: "G-T7NYG7LXSX"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

console.log("Firebase initialized:", app);

// Navbar toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.navbar ul');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Firebase Auth UI Elements
const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userDetails = document.getElementById('userDetails');

// Handle Auth State Changes. called on page load 
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // If on the admin page, check admin access
        if (window.location.pathname.includes("admin.html")) {
            checkAdminAccess(user);
        }
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        userDetails.innerHTML = `<h3>Hello ${user.displayName}!</h3> <p>User ID: ${user.uid}</p> <p>Click <a href="admin.html">here</a> to access admin page</p>`;
    } else {
        // Redirect unauthorized users trying to access the admin page
        if (window.location.pathname.includes("admin.html")) {
            window.location.href = "login.html";
        }
        if (whenSignedIn) {
            whenSignedIn.hidden = true;
            whenSignedOut.hidden = false;
            userDetails.innerHTML = '';
        }
    }
});

async function validateAndSubmit(username, password) {
    // Email validation regex pattern
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0<｜begin▁of▁sentence｜>.com|.net|.io|.in|.biz]+$/;

    // Password validation regex pattern (minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character)
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    // Validate the email format
    if (!emailPattern.test(username)) {
        console.error("Invalid email format.");
        return false;
    }

    // Validate the password strength
    // if (!passwordPattern.test(password)) {
    //     console.error("Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number and one special character.");
    //     return false;
    // }

    // If all validations are passed, sign in with email and password
    try {
        const userCredential = await signInWithEmailAndPassword(auth, username, password);
        console.log("User signed in:", userCredential.user);
        return true;
    } catch (error) {
        console.error("Sign-in error:", error);
        return false;
    }
}

// Function to check if user is an admin
async function checkAdminAccess(user) {
    if (!user) {
        window.location.href = "index.html"; // Redirect if no user
        return;
    }


    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
        console.log("Doc data:", userDoc.data());
    }

    if (userDoc.exists() && userDoc.data().role === "admin") {
        console.log("Admin access granted");
    } else {
        alert("Access Denied! You are not an admin.");
        window.location.href = "index.html"; // Redirect non-admins
    }
}


window.showModal = function () {
    document.getElementById('myModal').style.display = "block";
}

window.hideModal = function () {
    document.getElementById('myModal').style.display = "none";
}

//only load these on admin or login pages
if (window.location.pathname.includes("admin.html") || window.location.pathname.includes("login.html")) {
    // Sign-in with Google
    signInBtn.onclick = () => {
        console.log('Sign-in button clicked');
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("User signed in:", result.user);
            })
            .catch((error) => {
                console.error("Sign-in error:", error);
            });
    };

    // Sign-out function
    signOutBtn.onclick = () => {
        signOut(auth).then(() => {
            console.log("User signed out");
        });
    };

    // Sign-in with email password 
    if (window.location.pathname.includes("login.html")) {
        document.getElementById('loginForm').addEventListener('submit', async function
            (event) {
            event.preventDefault();  // Preventing the default form submission behaviour
            var username = document.getElementById("username").value;
            var password = document.getElementById("password").value;
            let validate = await validateAndSubmit(username, password)
            if (!validate) {
                console.log('outer call to showmodal');
                showModal();
            }
        });
    }

}

//only admin page stuff here 
if (window.location.pathname.includes("admin.html")) {
    document.getElementById("uploadBtn").addEventListener("click", () => {
        const file = document.getElementById("uploadImage").files[0];
        if (!file) return alert("No file selected");

        const storageRef = storage.ref("images/" + file.name);
        storageRef.put(file).then(() => alert("File uploaded!"));
    });

    document.getElementById("saveBlog").addEventListener("click", () => {
        const content = document.getElementById("blogContent").value;
        if (!content) return alert("Blog content is empty");

        db.collection("blog").add({ content, timestamp: firebase.firestore.FieldValue.serverTimestamp() })
            .then(() => alert("Blog saved!"));
    });
}