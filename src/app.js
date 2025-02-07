// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, getDocs, addDoc } from "firebase/firestore";
import { uploadBytesResumable, getStorage, ref, getDownloadURL } from "firebase/storage";

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
const storage = getStorage();

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
let gUser = null;
onAuthStateChanged(auth, async (user) => {
    if (user) {
        gUser = user;
        // If on the admin page, check admin access
        if (window.location.pathname.includes("admin.html")) {
            checkAdminAccess(user);
        }
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        userDetails.innerHTML = `<h3>Hello ${user.displayName}!</h3><p>Click <a href="admin.html">here</a> to access admin page</p>`;
        console.log(`User ID: ${user.uid}`);
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

window.downloadFile = function (fileName) {
    const fileRef = ref(storage, 'pdfDownloads/' + fileName);

    getDownloadURL(fileRef).then((url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        // Open in a new tab
        link.target = "_blank";
        // Append to body or a specific element if you want the download link available elsewhere on your page.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(console.error);
}

// login pop up things 
window.showModal = function () {
    document.getElementById('myModal').style.display = "block";
}

window.hideModal = function () {
    document.getElementById('myModal').style.display = "none";
}


//only load these on district page
if (window.location.pathname.includes("district.html")) {
    // Load board members from Firestore
    console.log('Loading board members from Firestore');
    window.onload = async function () {
        const querySnapshot = await getDocs(collection(db, 'boardMembers'));
        querySnapshot.forEach((doc) => {
            const boardMember = doc.data();
            console.log(boardMember);
            // Add the board member to a card element in the div with id "boardMemCards"
            // Add the board member to a card element in the div with id  "boardMemCards"
            const cardElement = document.getElementById('boardMemCards');
            const card = document.createElement('div');
            card.className = 'card';
            //Set board member img 
            const imgElement = document.createElement('img');
            //get image from firebase storage 
            const imgRef = ref(storage, 'images/boardMembers/' + boardMember.imageName);
            getDownloadURL(imgRef).then((url) => {
                imgElement.src = url;
            }).catch((error) => {
                console.error("Error getting download URL:", error);
            });
            imgElement.alt = boardMember.imageName;
            imgElement.className = 'card-img';
            card.appendChild(imgElement);

            //Set board member name
            const nameElement = document.createElement('h2');
            nameElement.textContent = boardMember.name;
            card.appendChild(nameElement);
            //Set board member title
            const title = document.createElement('h3');
            title.textContent = boardMember.title;
            card.appendChild(title);
            //Set board member dates
            const dates = document.createElement('p');
            dates.textContent = boardMember.dates;
            card.appendChild(dates);
            cardElement.appendChild(card);
        });
    }

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
    //add function to call when button: submitNewBoardMember is clicked to get the form data 
    document.addEventListener('DOMContentLoaded', function () {

        document.getElementById('submitNewBoardMember').onclick = async function (event) {
            console.log("submitNewBoardMember clicked");
            event.preventDefault();  // Preventing the default form submission behaviour
            var formData = {
                name: document.getElementById("name").value,
                title: document.getElementById("title").value,
                dates: document.getElementById("dates").value,
            };
            if (document.getElementById("imageUpload")) {
                formData.imageName = document.getElementById("imageUpload").files[0].name;
            }

            let validate = await validateBoardMember(formData);
            if (!validate) {
                console.log('outer call to showmodal');
                showModal();
            } else { //if validation passes, continue to insert into firestore 
                //check if admin 
                checkAdminAccess(gUser);
                //write to firestore
                console.log('Writing doc to firestore...');
                try {
                    await addDoc(collection(db, "boardMembers"), formData)
                        .then((docRef) => {
                            console.log("Document written with ID: ", docRef.id);
                        });
                    console.log('Document inserted successfully');
                } catch (error) {
                    console.error('Error writing document to Firestore:', error);
                }

                //get image from input field and upload to firebase storage
                const imgFile = document.getElementById('imageUpload').files[0];
                const storageRef = ref(storage, `images/boardMembers/${imgFile.name}`);

                try {
                    //change submit button text to "Inserting..." 
                    document.getElementById('submitNewBoardMember').innerText = "Inserting...";
                    //upload the image to firebase storage
                    const uploadTask = uploadBytesResumable(storageRef, imgFile);
                    uploadTask.on('state_changed', (snapshot) => {
                        const percentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        console.log(`Upload is ${percentage}% complete.`);
                        document.getElementById('submitNewBoardMember').innerText = `Upload is ${percentage}% complete.`;
                    }, (error) => {
                        console.error('Error uploading file:', error);
                    });
                    uploadTask.on('complete', () => {
                        document.getElementById('submitNewBoardMember').innerText = "Inserting...";
                        document.getElementById('submitNewBoardMember').innerText = "Upload successful!";
                    });

                    console.log("File uploaded successfully!");
                    //reset the form after successful upload
                    document.getElementById('boardMemberForm').reset();
                    //sleep for 10 seconds before resetting submitNewBoardMember button text 
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    document.getElementById('submitNewBoardMember').innerText = "Submit";
                } catch (error) {
                    console.error("Upload failed:", error);
                }

            }
        };
    });

    function validateBoardMember(formData) {
        console.log(`validateBoardMember called with: ${JSON.stringify(formData)}`);
        //if formdata is empty, return false
        if (!formData) {
            console.error("Form data is empty");
            return false;
        }
        //check that formData has: name, title, dates, imageName, image File uploaded
        if (!formData.name || !formData.title || !formData.dates || !formData.imageName) {
            console.error("Form data is missing required fields");
            return false;
        }

        return true;  // All validations passed
    }
}