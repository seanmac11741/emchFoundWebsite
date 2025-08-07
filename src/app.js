// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getPerformance } from "firebase/performance";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, collection, query, orderBy, deleteDoc, getDocs, addDoc, setDoc, where } from "firebase/firestore";
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
        if (window.location.pathname.includes("admin")) {
            checkAdminAccess(user);
        }
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        userDetails.innerHTML = `<h3>Hello ${user.displayName}!</h3><p>Click <a href="admin.html">here</a> to access admin page</p>`;
        console.log(`User ID: ${user.uid}`);
    } else {
        // Redirect unauthorized users trying to access the admin page
        if (window.location.pathname.includes("admin")) {
            alert("Access Denied! You are not an admin.");
            window.location.href = "login";
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
                    //set the file name to whatever it was before this, do not allow user to change this, it is hardcoded on html pages
                    let pdfFileName = pdfFile.name;
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

//Function to display the scholarship cards and put them in staffScholCards div
/**
 * 
 * @param {String} type staff or student
 * @param {Boolean} delButton true if we want a delete button on here, only for admin page 
 */
async function displayStaffScholarshipCards(type, delButton = false) {
    console.log('Getting staff scholarship cards of type: ' + type);
    let cardsDiv;
    if (type == 'staff') {
        cardsDiv = 'staffScholarshipCards';
    } else if (type == 'student') {
        cardsDiv = 'nonStaffScholarshipCards';
    }
    document.getElementById(cardsDiv).innerHTML = ''; // clear the existing cards
    const collRef = collection(db, 'staffscholarship');
    const q = query(collRef, orderBy("createdAt", "desc"), where("type", "==", type));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const scholar = doc.data();
        console.log('scholar:', scholar);
        const cardElement = document.getElementById(cardsDiv);
        const card = document.createElement('div');
        card.className = 'FoundationCard';
        //Set scholar member img 
        const imgElement = document.createElement('img');
        //get image from firebase storage 
        const imgRef = ref(storage, 'images/scholars/' + scholar.image);
        getDownloadURL(imgRef).then((url) => {
            imgElement.src = url;
        }).catch((error) => {
            console.error("Error getting download URL:", error);
        });
        imgElement.alt = scholar.image;
        imgElement.className = 'card-img';
        card.appendChild(imgElement);

        //Set scholar name
        const nameElement = document.createElement('h2');
        nameElement.textContent = scholar.name;
        card.appendChild(nameElement);
        //Set scholar title
        const title = document.createElement('h3');
        title.textContent = scholar.title;
        card.appendChild(title);
        //Set scholar dates
        const dates = document.createElement('h3');
        dates.textContent = scholar.year;
        card.appendChild(dates);
        //set scholar body 
        const bodyText = document.createElement('p');
        bodyText.textContent = scholar.body;
        card.appendChild(bodyText);

        if (delButton) {
            const delButton = document.createElement('button');
            delButton.textContent = 'Delete Scholar';
            delButton.addEventListener('click', async function () {
                //delete from firestore
                await DeleteScholarFirestore(scholar.image);
                console.log('Image deleted from Firestore: ' + scholar.image);
                //delete image from storage 
                await DeleteScholarImg(scholar.image);
                console.log('Image deleted from storage: ' + scholar.image);
                //delete the card from the DOM
                cardElement.removeChild(card);
            });


            // Use MutationObserver to listen for changes in the DOM
            const observer = new MutationObserver((mutationsList, observer) => {
                const cardExists = document.querySelector('.scholar-card');
                if (!cardExists) {
                    // Remove the event listener when the card is removed from the DOM
                    delButton.removeEventListener('click', async function () { });
                    observer.disconnect();
                }
            });
            // Start observing the target node for configured mutations
            observer.observe(document.body, { childList: true });
            card.appendChild(delButton);
        }
        cardElement.appendChild(card);
    });
}

//function to delete scholar from firestore 
async function DeleteScholarFirestore(imgAltText) {
    console.log('Deleting scholar from Firestore: ' + imgAltText);
    //get document ref id from firestore 
    const collectionRef = collection(db, "staffscholarship");
    const querySnapshot = await getDocs(collectionRef);
    let docId = '';
    querySnapshot.forEach(doc => {
        if (doc.data().image === imgAltText) {
            docId = doc.id;
        }
    });
    const docRef = doc(db, "staffscholarship", docId);
    console.log('Document ID to delete:', docId);
    await deleteDoc(docRef).then(() => {
        console.log('scholar deleted successfully: ' + docId);
    }).catch((error) => {
        console.error('Error deleting scholar member from Firestore:', error);
    });
};

// Function to delete scholar img
async function DeleteScholarImg(imgAltText) {
    //check if admin
    console.log('Deleting scholar image: ' + imgAltText);
    const imgRef = ref(storage, 'images/scholars/' + imgAltText);
    await deleteObject(imgRef).then(() => {
        console.log('Image deleted successfully');
    }).catch((error) => {
        console.error('Error deleting image:', error);
    });
};

//Function to display the Foundation board members 
async function displayFoundBoardMembers() {
    //clear the FoundboardMemCards div
    document.getElementById('FoundboardMemCards').innerHTML = '';

    //get data from firestore 
    const collectionRef = collection(db, 'foundBoardMembers');
    const q = query(collectionRef, orderBy("displayOrder", "asc"));
    const querySnapshot = await getDocs(q);

    // querySnapshot.forEach((doc) => {
    for (const doc of querySnapshot.docs) {
        const boardMember = doc.data();
        console.log(boardMember);
        // Add the board member to a card element in the div with id "FoundboardMemCards"
        const cardElement = document.getElementById('FoundboardMemCards');
        const card = document.createElement('div');
        card.className = 'FoundationCard';
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
        title.textContent = boardMember.foundTitle;
        card.appendChild(title);
        //Set board member dates
        const dates = document.createElement('h3');
        dates.textContent = boardMember.districtTitle;
        card.appendChild(dates);

        cardElement.appendChild(card);
    };
};


// Function to display board members in the boardMemCards div
async function displayBoardMembers() {
    //clear the boardMemCards div
    document.getElementById('boardMemCards').innerHTML = '';
    // const querySnapshot = await getDocs(collection(db, 'boardMembers'));

    //get data from firestore 
    const collectionRef = collection(db, 'boardMembers');
    const q = query(collectionRef, orderBy("displayOrder", "asc"));
    const querySnapshot = await getDocs(q);

    // querySnapshot.forEach((doc) => {
    for (const doc of querySnapshot.docs) {
        const boardMember = doc.data();
        console.log(boardMember);
        // Add the board member to a card element in the div with id "boardMemCards"
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
    };
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

async function DeleteFoundBoardMemImg(imgAltText) {
    //check if picture is used in district boardmembers 
    const collectionRef = collection(db, "boardMembers");
    const querySnapshot = await getDocs(collectionRef);
    let docId = 'x';
    querySnapshot.forEach(doc => {
        if (doc.data().imageName === imgAltText) {
            docId = doc.id;
        }
    });
    if (docId != 'x') {
        console.log('Img in use for district Board members');
        return;
    }

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

//function to delete a foundation board member from Firestore 
async function DeleteFoundBoardMemFirestore(imgAltText) {
    console.log('Deleting board member from Firestore: ' + imgAltText);
    //get document ref id from firestore 
    const collectionRef = collection(db, "foundBoardMembers");
    const querySnapshot = await getDocs(collectionRef);
    let docId = '';
    querySnapshot.forEach(doc => {
        if (doc.data().imageName === imgAltText) {
            docId = doc.id;
        }
    });
    const docRef = doc(db, "foundBoardMembers", docId);
    console.log('Document ID to delete:', docId);
    await deleteDoc(docRef).then(() => {
        console.log('Foundation Board member deleted successfully');
    }).catch((error) => {
        console.error('Error deleting Foundation board member from Firestore:', error);
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

/**
 * This function uploads a blog post to firestore
 * @param {e} event 
 */
window.handleSubmitCreateBlogPost = async function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Get values from the inputs
    var title = document.getElementById('blogTitle').value;
    var body = document.getElementById('blogBody').value;
    var createdAt = document.getElementById('createBlogCreatedAt').value;
    var fbEmbed = document.getElementById('fbEmbed').value;
    var squareLink = document.getElementById('squareLink').value;
    var squareButtonText = document.getElementById('squareButtonText').value;
    var squareTableSponsor = document.getElementById('squareTableSponsor').value;

    let blogPostData = {
        title: title,
        body: body,
        createdAt: createdAt,
        fbEmbed: fbEmbed,
        squareLink: squareLink,
        squareButtonText: squareButtonText,
        squareTableSponsor: squareTableSponsor
    };
    console.log('Creating blog post with data:');
    console.log(blogPostData);

    //upload blog post to firestore
    await addDoc(collection(db, "blogposts"), blogPostData)
        .then((docRef) => {
            console.log("Document written with ID: ", docRef.id);
        });
    //show a message to user that it uploaded 
    alert(`Blog post created successfully with title: ${title}!`);
    // clear the form fields
    document.getElementById('blogForm').reset();
    //reload blogs
    await blogPostsWithDeleteButton();

}

async function addDeleteButton2BoardMems() {
    var boardMembers = document.querySelectorAll('.boardMemCards');
    boardMembers.forEach(async function (member) {
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

            //Set board member displayOrder
            const displayOrder = document.createElement('p');
            let dispOrder = await getDisplayOrder('boardMembers', delImg);
            displayOrder.textContent = 'Display Order:' + dispOrder;
            card.appendChild(displayOrder);

            const upPositionBtn = document.createElement('button');
            upPositionBtn.textContent = 'Move Up Position';
            upPositionBtn.addEventListener('click', async function () {
                //add 1.1 to the position of the person 
                await MovePosition('boardMembers', delImg, true);
            });

            card.appendChild(upPositionBtn);

            const downPositionBtn = document.createElement('button');
            downPositionBtn.textContent = 'Move Down Position';
            downPositionBtn.addEventListener('click', async function () {
                //subtract 1.1 from the position of the person 
                await MovePosition('boardMembers', delImg, false);
            });
            card.appendChild(downPositionBtn);

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

async function getDisplayOrder(col, imgAltText) {
    console.log('Get display order clicked from Firestore: ' + imgAltText);
    const collectionRef = collection(db, col);
    const querySnapshot = await getDocs(collectionRef);
    let docId = '';
    querySnapshot.forEach(doc => {
        if (doc.data().imageName === imgAltText) {
            docId = doc.id;
        }
    });
    const docRef = doc(db, col, docId);
    console.log('Document ID to update:', docId);
    let currentPos = await getDoc(docRef);
    if (currentPos.exists()) {
        console.log("Document data displayOrder:", currentPos.data().displayOrder);
    } else {
        // currentPos.data() will be undefined in this case
        console.error("No such document!");
    }
    return currentPos.data().displayOrder;
}

/**
 * 
 * @param {String} col Collection to update
 * @param {String} imgAltText alt text to identify item
 * @param {Boolean} upOrDown true for up 1.1, false for down 1.1
 */
async function MovePosition(col, imgAltText, upOrDown) {
    console.log('Move up position clicked from Firestore: ' + imgAltText);
    console.log('With col: ' + col);
    //get document ref id from firestore 
    try {

        const collectionRef = collection(db, col);
        const querySnapshot = await getDocs(collectionRef);
        let docId = '';
        querySnapshot.forEach(doc => {
            if (doc.data().imageName === imgAltText) {
                docId = doc.id;
            }
        });
        const docRef = doc(db, col, docId);
        console.log('Document ID to update:', docId);
        let currentPos = await getDoc(docRef);
        if (currentPos.exists()) {
            console.log("Document data displayOrder:", currentPos.data().displayOrder);
        } else {
            // currentPos.data() will be undefined in this case
            console.error("No such document!");
        }

        let newPos
        if (upOrDown) {
            //for true, we decrement the value, moving this person up in the order 
            newPos = parseFloat(currentPos.data().displayOrder) - 1.1;
        } else {
            newPos = parseFloat(currentPos.data().displayOrder) + 1.1;
        }
        newPos = parseFloat(newPos.toFixed(2)); //round to 2 decimal places 

        console.log('New displayOrder:', newPos);
        await updateDoc(docRef, { displayOrder: newPos });
        console.log('Updating displayOrder...');
        if (col == 'boardMembers') {
            await displayBoardMembers();
            await addDeleteButton2BoardMems();
        } else if (col == 'foundBoardMembers') {
            await displayFoundBoardMembers();
            await addDeleteButton2FoundBoardMems();
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error updating displayOrder!");
    }
}

async function addDeleteButton2FoundBoardMems() {
    //now add delete button to the foundation board members 
    var boardMembers = document.querySelectorAll('.FoundboardMemCards');
    boardMembers.forEach(async function (member) {
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

            //Set board member displayOrder
            const displayOrder = document.createElement('p');
            let dispOrder = await getDisplayOrder('foundBoardMembers', delImg);
            displayOrder.textContent = 'Display Order:' + dispOrder;
            card.appendChild(displayOrder);

            const upPositionBtn = document.createElement('button');
            upPositionBtn.textContent = 'Move Up Position';
            upPositionBtn.addEventListener('click', async function () {
                //add 1.1 to the position of the person 
                await MovePosition('foundBoardMembers', delImg, true);
            });

            card.appendChild(upPositionBtn);

            const downPositionBtn = document.createElement('button');
            downPositionBtn.textContent = 'Move Down Position';
            downPositionBtn.addEventListener('click', async function () {
                //subtract 1.1 from the position of the person 
                await MovePosition('foundBoardMembers', delImg, false);
            });
            card.appendChild(downPositionBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';

            deleteBtn.addEventListener('click', async function () {
                console.log('Delete img: ', delImg);
                try {
                    await DeleteFoundBoardMemImg(delImg);
                    await DeleteFoundBoardMemFirestore(delImg);
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
        const queryDoc = querySnapshot.docs[i];
        console.log('Blog post:', queryDoc.data());
        console.log('queryDoc.data().squareLink is: ' + queryDoc.data().squareLink);
        const blogPostDiv = getBlogPostHtml(queryDoc);
        blogPostContainer.appendChild(blogPostDiv);
    }
}

async function displayMostRecentBlogPost() {
    const blogPostContainer = document.getElementById('singleBlogPost');
    blogPostContainer.innerHTML = '';
    //get data from firestore 
    const collectionRef = collection(db, 'blogposts');
    const q = query(collectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    for (let i = 0; i < 1; i++) {
        const queryDoc = querySnapshot.docs[i];
        console.log('Blog post:', queryDoc.data());
        let blogPostDiv = getBlogPostHtml(queryDoc);
        blogPostContainer.appendChild(blogPostDiv);
    }
}

/**
 * Load blog posts with a delete button just for the admin page 
 */
async function blogPostsWithDeleteButton() {
    console.log('Loading blog posts from Firestore');
    //blank out container
    const blogPostContainer = document.getElementById('blogPostContainer');
    blogPostContainer.innerHTML = '';
    //get data from firestore 
    const collectionRef = collection(db, 'blogposts');
    const q = query(collectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    for (let i = 0; i < querySnapshot.docs.length; i++) {
        const queryDoc = querySnapshot.docs[i];
        console.log('Blog post:', queryDoc.data());
        let blogPostDiv = getBlogPostHtml(queryDoc, { delBut: true });
        blogPostContainer.appendChild(blogPostDiv);
    }
}

//get blog posts from Firestore and add them to a div container named: "blogPostContainer"
/**
 * blogpost document structure:
 * {
 *  "title": "Sample Blog Post",
 *  "body": "This is a sample blog post.",
 *  "createdAt": "2023-10-05T14:30:00Z",
 *  "fbEmbed":"<iframe></iframe>",
 *  "squareLink":"https://www.example.com",
 *  "squareButtonText":"Buy Tickets now!",
 *  "squareTableSponsor": "https://square.com/aasdf"
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
function getBlogPostHtml(queryDoc, config) {
    const blogPostDiv = document.createElement('div');
    blogPostDiv.className = 'blogPost';
    let squareLink = queryDoc.data().squareLink || '';
    let squareButtonText = queryDoc.data().squareButtonText || '';
    let squareTableSponsor = queryDoc.data().squareTableSponsor || '';
    let inhtml = `<div class="blogPost"><h2>${queryDoc.data().title}</h2>
    `;
    if (squareLink != '') {

        inhtml += `
            <a href="${squareLink}" target="_blank">
            <button class="crispy-fill">${squareButtonText ? squareButtonText : 'Buy Tickets now!'}</button>
            </a>`
    }

    if (squareTableSponsor != '') {
        inhtml += `
        <a href="${squareTableSponsor}" target="_blank">
        <button class="crispy-fill">Sponsor a Table</button>
        </a>`
    }

    inhtml += `
            <p>${queryDoc.data().body}</p>
            <div class="fbEmbed">${queryDoc.data().fbEmbed}</div>
            </div>`;

    blogPostDiv.innerHTML = inhtml;

    if (config && config.delBut) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', (function (docId) {
            return async function () {
                console.log('Deleting blog post:', docId);
                await deleteDoc(doc(db, 'blogposts', queryDoc.id));
                console.log('Blog post deleted successfully');
                blogPostsWithDeleteButton();
            };
        })(queryDoc.id));

        blogPostDiv.prepend(deleteButton);
    }

    return blogPostDiv;
}

if (window.location.pathname.includes("events")) {
    // Load blog posts from firestore 
    window.onload = async function () {
        await displayBlogPosts();
    }
}

//only load these on district page
if (window.location.pathname.includes("district")) {
    // Load board members from Firestore
    console.log('Loading board members from Firestore');
    window.onload = async function () {
        await displayBoardMembers();
    }
}

//only scholarship page stuff here 
if (window.location.pathname.includes("scholarships")) {
    // Load scholarship cards from Firestore 
    console.log('Loading scholarship cards from Firestore');
    window.onload = async function () {
        await displayStaffScholarshipCards('staff');
        await displayStaffScholarshipCards('student');
    }
}

//only index page stuff here 
if (document.getElementById('heroImageSlideshow')) {
    //load most recent blog post here into the singleBlogPost element 
    console.log('Loading most recent blog post from Firestore');
    await displayMostRecentBlogPost();
    await displayFoundBoardMembers();

    //Slideshow logic
    //Replace this element every 2 seconds heroImageSlideshow
    const heroImageSlideshow = document.getElementById('heroImageSlideshow');
    const SlideshowImages = [
        './images/HelipadEMCH.png',
        './images/ERinteriorBedRoomClean.png',
        './images/ERinteriorThreePeopleWorking.png',
        './images/ERsignOutside.png',
        './images/East-Morgan-County-Hospital_Exterior.jpg'
    ];
    let currentImageIndex = 0;
    heroImageSlideshow.classList.add('fade');
    setInterval(() => {
        heroImageSlideshow.src = SlideshowImages[currentImageIndex];
        currentImageIndex = (currentImageIndex + 1) % SlideshowImages.length;
    }, 5000);
}

//only load these on admin or login pages
if (window.location.pathname.includes("admin") || window.location.pathname.includes("login")) {
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
    // if (window.location.pathname.includes("login")) {
    //     document.getElementById('loginForm').addEventListener('submit', async function
    //         (event) {
    //         event.preventDefault();  // Preventing the default form submission behaviour
    //         var username = document.getElementById("username").value;
    //         var password = document.getElementById("password").value;
    //         let validate = await validateAndSubmit(username, password)
    //         if (!validate) {
    //             console.log('outer call to showmodal');
    //             showModal();
    //         }
    //     });
    // }

};

//only admin page stuff here 
if (window.location.pathname.includes("admin")) {

    //display the board members
    await displayBoardMembers();
    await displayFoundBoardMembers();
    //for each board member, add a delete button on the admin page only 
    await addDeleteButton2BoardMems();
    await addDeleteButton2FoundBoardMems();
    await SetPdfFiles();
    await showGovContactLink();
    await blogPostsWithDeleteButton();
    await displayStaffScholarshipCards('staff', true);
    await displayStaffScholarshipCards('student', true);



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
                formData.displayOrder = 1.1;
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
                await addDeleteButton2BoardMems();
            } catch (error) {
                console.error("Upload failed:", error);
            }

        }
    };

    //submit button for new Scholar recipient: 
    document.getElementById('submitNewScholar').onclick = async function (event) {
        console.log("submitNewScholar clicked");
        event.preventDefault();
        var formData = {
            body: document.getElementById("scholarBody").value,
            //createdAt in this format: March 21, 2025 at 1:23:33 PM UTC-5
            createdAt: new Date().toISOString(),
            image: document.getElementById("scholarImageUpload").files[0].name,
            name: document.getElementById("scholarName").value,
            title: document.getElementById("scholarTitle").value,
            type: document.querySelector('#scholarType').value,
            year: document.getElementById("scholarYear").value,
        };

        console.log('Creating new scholar with data:', formData);

        //insert into firestore 
        try {
            await addDoc(collection(db, "staffscholarship"), formData)
                .then((docRef) => {
                    console.log("Document written with ID: ", docRef.id);
                });
            console.log('Document inserted successfully');
        } catch (error) {
            console.error('Error writing document to Firestore:', error);
        }

        //get image from input field and upload to firebase storage
        const imgFile = document.getElementById('scholarImageUpload').files[0];
        const storageRef = ref(storage, `images/scholars/${imgFile.name}`);
        try {
            //change submit button text to "Inserting..." 
            document.getElementById('submitNewScholar').innerText = "Uploading...";
            //upload the image to firebase storage
            const uploadTask = uploadBytesResumable(storageRef, imgFile);
            uploadTask.on('state_changed', async (snapshot) => {
                const percentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                console.log(`Upload is ${percentage}% complete.`);
                document.getElementById('submitNewScholar').innerText = `Upload is ${percentage}% complete.`;
                if (snapshot.bytesTransferred === snapshot.totalBytes) {
                    console.log(`File uploaded successfully!`);
                    document.getElementById('submitNewScholar').innerText = "Upload successful!";
                }
            }, (error) => {
                console.error('Error uploading file:', error);
            });

            //reset the form after successful upload
            document.getElementById('addScholarForm').reset();
            //sleep for 5 seconds before resetting submitNewScholar button text 
            await new Promise(resolve => setTimeout(resolve, 5000));
            document.getElementById('submitNewScholar').innerText = "Submit";
            await displayStaffScholarshipCards(formData.type, true);
        } catch (error) {
            console.error("Upload failed:", error);
        }

    }


    //submit button for new Foundation board member: 
    document.getElementById('submitNewFoundBoardMember').onclick = async function (event) {
        console.log("submitNewFoundBoardMember clicked");
        event.preventDefault();  // Preventing the default form submission behaviour
        var formData = {
            name: document.getElementById("FoundationName").value,
            districtTitle: document.getElementById("districtTitle").value,
            foundTitle: document.getElementById("foundTitle").value,
        };
        if (document.getElementById("foundImageUpload")) {
            formData.imageName = document.getElementById("foundImageUpload").files[0].name;
        }

        let validate = await validateFoundBoardMember(formData);
        if (!validate) {
            console.log('outer call to showmodal');
            showModal();
        } else { //if validation passes, continue to insert into firestore 
            //write to firestore
            console.log('Writing doc to firestore...');
            try {
                formData.displayOrder = 1.1;
                await addDoc(collection(db, "foundBoardMembers"), formData)
                    .then((docRef) => {
                        console.log("Document written with ID: ", docRef.id);
                    });
                console.log('Document inserted successfully');
            } catch (error) {
                console.error('Error writing document to Firestore:', error);
            }

            //get image from input field and upload to firebase storage
            const imgFile = document.getElementById('foundImageUpload').files[0];
            const storageRef = ref(storage, `images/boardMembers/${imgFile.name}`);

            try {
                //change submit button text to "Inserting..." 
                document.getElementById('submitNewFoundBoardMember').innerText = "Inserting...";
                //upload the image to firebase storage
                const uploadTask = uploadBytesResumable(storageRef, imgFile);
                uploadTask.on('state_changed', async (snapshot) => {
                    const percentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    console.log(`Upload is ${percentage}% complete.`);
                    document.getElementById('submitNewFoundBoardMember').innerText = `Upload is ${percentage}% complete.`;
                    if (snapshot.bytesTransferred === snapshot.totalBytes) {
                        console.log(`File uploaded successfully!`);
                        document.getElementById('submitNewFoundBoardMember').innerText = "Upload successful!";
                        await displayFoundBoardMembers();
                    }
                }, (error) => {
                    console.error('Error uploading file:', error);
                });

                //reset the form after successful upload
                document.getElementById('foundBoardMemberForm').reset();
                //sleep for 10 seconds before resetting submitNewFoundBoardMember button text 
                await new Promise(resolve => setTimeout(resolve, 10000));
                document.getElementById('submitNewFoundBoardMember').innerText = "Submit";
                await addDeleteButton2FoundBoardMems();
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

function validateFoundBoardMember(formData) {
    console.log(`validateFoundBoardMember called with: ${JSON.stringify(formData)}`);
    //if formdata is empty, return false
    if (!formData) {
        console.error("Form data is empty");
        return false;
    }
    //check that formData has: name, title, dates, imageName, image File uploaded
    if (!formData.name || !formData.foundTitle || !formData.imageName) {
        console.error("Form data is missing required fields");
        return false;
    }

    return true;  // All validations passed
}