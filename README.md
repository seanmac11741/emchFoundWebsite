# emchFoundWebsite
Website for EMCH Foundation
https://emchfoundation.com/

## Design reqs 


## To run in dev with bun: 
```
#Run build in watch mode: https://firebase.google.com/docs/web/module-bundling
bun run build --watch
firebase serve 
```
## Deploy to firebase: 
```
#Run the build command
bun run build:prod
firebase deploy

```

## Notes 
* Square donation link for Foundation: https://square.link/u/jaG4W2Uo 
* cors.json is for downloading in the browser for the PDF files, I followed this documentation to get it working with gutil: https://firebase.google.com/docs/storage/web/download-files 
```bash 
gsutil cors set cors.json gs://emchfoundation.firebasestorage.app
```
### Backups 
```bash 
firebase firestore:backups:schedules:create --database '(default)' --recurrence 'WEEKLY' --retention 14w --day-of-week SUN

```

## Todo list 
- [x] Create bare bones website 
- [x] Aquire good pictures and put them in a slideshow on main page
- [x] Create good navbar layout
- [x] Deploy to Firebase
- [x] Add user auth and login 
- [x] Create blog page 
- [x] Make the home page a lot better. Big picture, fancy scroll animations
- [x] Add contact us section to the footer 
- [x] Dynamic Blog page 
- [x] Blog entries can be created
- [ ] Blog entries can be updated (delete should be enough)
- [x] Blog entries can be deleted
- [x] Blog entries can have embedded facebook albums
- [x] Add link to Paypal(Square?) site for donating 
- [x] replace paypal with Square link
- [ ] Embed square link/qr code 
- [x] Static Aux page with info 
- [x] Page with board members pictures/names sourced from firestore/db
- [x] Admin page can add/update/remove board members pictures/names 
- [x] Admin page to change pictures 
- [x] PDF Download working
- [x] Read and understand security here: https://firebase.google.com/docs/storage/security/rules-conditions#public 
- [x] PDF upload on admin page to change files
- [x] Go through this vid for education of Firebase: https://www.youtube.com/watch?v=iWEgpdVSZyg 
- [x] Lookup firebaseui for web and maybe use for login page (nope)
- [x] Title is being cutoff by navbar on large screens
- [x] Add Foundation board to home page. Found Board has District board + 4 others 
- [x] Make district board one row, that grows/shrinks
- [x] Add Wendy to contact us section
- [ ] On Admin page, just make text fields editable and update that way? 
- [ ] Change the sign in with Google button to look more like a real google button 
- [x] Fix title behind navbar
- [x] Square link on blog posts optional 
- [x] Update the square button text 
- [x] Facebook post optional
- [ ] setup firebase backup
- [x] Add Scholarship page 
- [x] sections for each scholarship should have pdf, and the most recent recipient
- [x] Admin page section for adding/removing Scholar recipients
- [x] Make text bigger on blog posts 
- [ ] Research formatted text field for bold/italic/etc (could maybe use quill https://www.npmjs.com/package/quill)
- [x] Add second button to blog posts for sponsoring a table (optional button) 
