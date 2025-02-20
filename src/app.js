// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getPerformance } from "firebase/performance";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, deleteDoc, getDocs, addDoc, setDoc } from "firebase/firestore";
import { uploadBytesResumable, getStorage, ref, getDownloadURL, deleteObject, listAll } from "firebase/storage";
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
const perf = getPerformance(app);
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

// Handle Auth State Changes. called on page load, so only one call needed for this ever
onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed:", user);
    if (user) {
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
            alert("Access Denied! You are not an admin.");
            window.location.href = "login.html";
        }
        if (whenSignedIn) {
            whenSignedIn.hidden = true;
            whenSignedOut.hidden = false;
            userDetails.innerHTML = '';
        }
    }
});

async function SetPdfFiles() {
    //fill in this div with current pdf files
    //clear out any in current div 
    let pdfFilesDiv = document.getElementById("pdfFilesdiv");
    pdfFilesDiv.innerHTML = "";

    const pdfFiles = await GetPdfFiles();
    pdfFiles.forEach(pdfFile => {
        console.log(pdfFile);
        const pdfFileDiv = document.createElement("div");
        pdfFileDiv.textContent = pdfFile.name + " --- " + pdfFile.fullPath;
        pdfFileDiv.classList.add("pdf-file");
        pdfFileDiv.appendChild(document.createElement("br"));
        //add a button for file upload to pdfFileDiv 
        const uploadButton = document.createElement("button");
        uploadButton.textContent = "Upload New PDF";
        uploadButton.addEventListener("click", async () => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = ".pdf";

            // Add event listener for 'change' on the input instead of calling click method
            fileInput.addEventListener("change", async () => {
                const file = fileInput.files[0];
                console.log('Adding new file:', file);
                if (file) {
                    let pdfFileName;
                    //only two of these, the file names are hardcoded to one of these two
                    if (file.name == "District-bylaws.pdf") {
                        pdfFileName = "District-bylaws.pdf";
                    } else {
                        pdfFileName = "Transparency-Notice.pdf";
                    }
                    // Upload the file to Firebase Storage
                    const storageRef = ref(storage, `pdfDownloads/${pdfFileName}`);
                    const uploadTask = uploadBytesResumable(storageRef, file);
                    uploadTask.on('state_changed', async (snapshot) => {
                        const percentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        console.log(`Upload is ${percentage}% complete.`);
                        uploadButton.innerText = `Upload is ${percentage}% complete.`;
                        if (snapshot.bytesTransferred === snapshot.totalBytes) {
                            console.log(`File uploaded successfully!`);
                            uploadButton.innerText = "Upload successful!";
                            return SetPdfFiles();
                        }
                    }, (error) => {
                        console.error('Error uploading file:', error);
                    });
                }
            });

            // Call click method to open file dialog
            fileInput.click();
        });
        pdfFileDiv.appendChild(uploadButton);
        document.getElementById("pdfFilesdiv").appendChild(pdfFileDiv);
    });
}

/**
 * Returns a promise that resolves to an array of pdf file names.
 */
async function GetPdfFiles() {
    let retarr = [];
    const listRef = ref(storage, 'pdfDownloads/');

    try {
        const res = await listAll(listRef);

        res.items.forEach((item) => {
            retarr.push({ name: item.name, fullPath: item.fullPath });
        });
    } catch (error) {
        console.error('Error listing files', error);
    }

    return retarr;
}

async function showGovContactLink() {
    //fill in this div with current link govContactLink
    const url = await GetGovContactLink();
    document.getElementById('govContactLink').innerHTML = `<p>Current url:</p><p> ${url}</p>`;
}

window.updateGovContact = async function (newUrl) {
    console.log('updateGovContact called with:' + newUrl);
    const linkRef = doc(db, 'govLink', 'govLink1');
    await setDoc(linkRef, { url: newUrl }, { merge: true });
    await showGovContactLink();
}

// Function to display board members in the boardMemCards div
async function displayBoardMembers() {
    //clear the boardMemCards div
    document.getElementById('boardMemCards').innerHTML = '';
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
};

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
};

// Function to check if user is an admin
async function checkAdminAccess(user) {
    if (!user) {
        alert("Access Denied! You are not an admin.");
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
};

// Function to delete board member image
async function DeleteBoardMemImg(imgAltText) {
    //check if admin
    console.log('Deleting board member image: ' + imgAltText);
    const imgRef = ref(storage, 'images/boardMembers/' + imgAltText);
    await deleteObject(imgRef).then(() => {
        console.log('Image deleted successfully');
    }).catch((error) => {
        console.error('Error deleting image:', error);
    });
};

//function to delete board member from firestore 
async function DeleteBoardMemFirestore(imgAltText) {
    console.log('Deleting board member from Firestore: ' + imgAltText);
    //get document ref id from firestore 
    const collectionRef = collection(db, "boardMembers");
    const querySnapshot = await getDocs(collectionRef);
    let docId = '';
    querySnapshot.forEach(doc => {
        if (doc.data().imageName === imgAltText) {
            docId = doc.id;
        }
    });
    const docRef = doc(db, "boardMembers", docId);
    console.log('Document ID to delete:', docId);
    await deleteDoc(docRef).then(() => {
        console.log('Board member deleted successfully');
    }).catch((error) => {
        console.error('Error deleting board member from Firestore:', error);
    });
};

async function GetGovContactLink() {
    const collectionRef = collection(db, "govLink");
    const querySnapshot = await getDocs(collectionRef);
    let url = "404.html";
    querySnapshot.forEach(doc => {
        url = doc.data().url;
        console.log('Colorado Government link found:', url);
    });
    return url;

}

//open the gov contact link in a new window 
window.OpenGovContactLink = async function () {
    //get colorado gov link from firestore 
    const url = await GetGovContactLink();
    window.open(url, '_blank');
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


async function addDeleteButton2BoardMems() {
    var boardMembers = document.querySelectorAll('.boardMemCards');
    boardMembers.forEach(function (member) {
        console.log('member:', member);

        // Get all child elements of the member
        const children = Array.from(member.children).filter((child) => child instanceof HTMLElement);
        for (const card of children) {
            //child is the card element here 
            let delImg;
            console.log('child:', card);
            const gchildren = Array.from(card.children).filter((gchild) => gchild instanceof HTMLElement);
            for (const gchild of gchildren) {
                //one of the gchilds is an img tag, we need the alt text from that as a key for the delete operation
                if (gchild.className === 'card-img') {
                    delImg = gchild.alt;
                    console.log('delImg:', delImg);
                }
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';

            deleteBtn.addEventListener('click', async function () {
                console.log('Delete img: ', delImg);
                try {
                    await DeleteBoardMemImg(delImg);
                    await DeleteBoardMemFirestore(delImg);
                    card.remove();
                    console.log('Image deleted successfully!');
                } catch (error) {
                    console.error('Error deleting board member image:', error);
                }

            });

            card.appendChild(deleteBtn);

        }
    });
}

//get blog posts from Firestore and add them to a div container named: "blogPostContainer"
/**
 * blogpost document structure:
 * {
 *  "title": "Sample Blog Post",
 *  "body": "This is a sample blog post.",
 *  "createdAt": "2023-10-05T14:30:00Z",
 *  "fbEmbed":"<iframe></iframe>"
 *  "squareLink":"https://www.example.com"
 * }
 * 
 * blogpotdiv looks like this: 
 * <div class="blogPost" id="blogPost">
            <h2>Summer Fundraiser</h2>
            <a href="https://square.link/u/1" target="_blank">
                <button class="crispy-fill">Buy Tickets now!</button>
            </a>
            <p>Lorem Ipsum.</p>

            <div class="fbEmbed">
                <iframe
                    </iframe>
            </div>
        </div>
 */
async function displayBlogPosts() {
    console.log('Loading blog posts from Firestore');
    //blank out container
    const blogPostContainer = document.getElementById('blogPostContainer');
    blogPostContainer.innerHTML = '';
    //get data from firestore 
    const collectionRef = collection(db, 'blogposts');
    const q = query(collectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    for (let i = 0; i < querySnapshot.docs.length; i++) {
        const doc = querySnapshot.docs[i];
        console.log('Blog post:', doc.data());
        const blogPostDiv = document.createElement('div');
        blogPostDiv.className = 'blogPost';
        blogPostDiv.innerHTML = `<div class="blogPost"><h2>${doc.data().title}</h2>
            <a href="${doc.data().squareLink}" target="_blank">
                <button class="crispy-fill">Buy Tickets now!</button>
            </a>
            <p>${doc.data().body}</p>
            <div class="fbEmbed">${doc.data().fbEmbed}</div>
            </div>`;
        blogPostContainer.appendChild(blogPostDiv);
    }
}

if (window.location.pathname.includes("events.html")) {
    // Load blog posts from firestore 
    window.onload = async function () {
        await displayBlogPosts();
    }
}

//only load these on district page
if (window.location.pathname.includes("district.html")) {
    // Load board members from Firestore
    console.log('Loading board members from Firestore');
    window.onload = async function () {
        await displayBoardMembers();
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

};

//only admin page stuff here 
if (window.location.pathname.includes("admin.html")) {

    //display the board members
    await displayBoardMembers();
    //for each board member, add a delete button on the admin page only 
    await addDeleteButton2BoardMems();
    await SetPdfFiles();
    await showGovContactLink();

    //add function to call when button: submitNewBoardMember is clicked to get the form data 

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
                uploadTask.on('state_changed', async (snapshot) => {
                    const percentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    console.log(`Upload is ${percentage}% complete.`);
                    document.getElementById('submitNewBoardMember').innerText = `Upload is ${percentage}% complete.`;
                    if (snapshot.bytesTransferred === snapshot.totalBytes) {
                        console.log(`File uploaded successfully!`);
                        document.getElementById('submitNewBoardMember').innerText = "Upload successful!";
                        await displayBoardMembers();
                    }
                }, (error) => {
                    console.error('Error uploading file:', error);
                });

                //reset the form after successful upload
                document.getElementById('boardMemberForm').reset();
                //sleep for 10 seconds before resetting submitNewBoardMember button text 
                await new Promise(resolve => setTimeout(resolve, 10000));
                document.getElementById('submitNewBoardMember').innerText = "Submit";
                //TODO: for some reason, this does not dynamically add the delete buttons... meh
                await addDeleteButton2BoardMems();
            } catch (error) {
                console.error("Upload failed:", error);
            }

        }
    };
}

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