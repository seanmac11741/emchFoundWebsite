# emchFoundWebsite
Website for EMCH Foundation
Firebase url: https://emchfoundation.web.app/

## Design reqs 


## To run in dev with bun: 
```
#bun build is not working, use webpack
bun build src/app.js --outdir ./public --watch 
#then spool up the ./public/index.html file with LiveServer 
# or launch firebase version for emulators 
#Run build in watch mode: https://firebase.google.com/docs/web/module-bundling
bun run build --watch
firebase serve 
```
## Deploy to firebase: 
```
#Run the build command
bun build src/app.js --outdir ./public
firebase deploy

```

## Notes 
* Square donation link for Foundation: https://square.link/u/jaG4W2Uo 
* cors.json is for downloading in the browser for the PDF files, I followed this documentation to get it working with gutil: https://firebase.google.com/docs/storage/web/download-files 
```bash 
gsutil cors set cors.json gs://emchfoundation.firebasestorage.app
```

## Todo list 
- [x] Create bare bones website 
- [ ] Aquire good pictures 
- [x] Create good navbar layout
- [x] Deploy to Firebase
- [x] Add user auth and login 
- [x] Create blog page 
- [ ] Make the home page a lot better. Big picture, fancy scroll animations
- [ ] Blog entries can be create/read/update/deleted
- [ ] Blog entries can have embedded facebook albums
- [x] Add link to Paypal(Square?) site for donating 
- [x] replace paypal with Square link
- [ ] Embed square link/qr code 
- [x] Static Aux page with info 
- [ ] Able to edit Aux page images and words on admin page 
- [x] Page with board members pictures/names sourced from firestore/db
- [ ] Admin page can add/update/remove board members pictures/names 
- [x] Admin page to change pictures 
- [x] PDF Download working
- [ ] Read and understand security here: https://firebase.google.com/docs/storage/security/rules-conditions#public 
- [x] PDF upload on admin page to change files
- [ ] Add 2fa for non-google users 
- [ ] Go through this vid for education of Firebase: https://www.youtube.com/watch?v=iWEgpdVSZyg 
- [ ] Lookup firebaseui for web and maybe use for login page