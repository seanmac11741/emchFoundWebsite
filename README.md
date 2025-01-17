# emchFoundWebsite
Website for EMCH Foundation
Firebase url: https://emchfoundation.web.app/

## Design reqs 


## To run in dev with bun: 
```
bun build src/app.js --outdir ./public --watch
#then spool up the ./public/index.html file with LiveServer
```
## Deploy to firebase: 
```
#Run the build command
bun build src/app.js --outdir ./public
firebase deploy

```

## Todo list 
- [x] Create bare bones website 
- [ ] Aquire good pictures 
- [x] Create good navbar layout
- [x] Deploy to Firebase
- [ ] Add user auth and login 
- [ ] Create blog page 
- [ ] Blog entries can be create/read/update/deleted
- [ ] Blog entries can have embedded facebook albums
- [ ] Add link to Paypal(Square?) site for donating 
- [ ] Static Aux page with info 
- [ ] Page with board members pictures/names
- [ ] Allow editing of board members picture/names 
- [ ] Admin page to change pictures 
- [ ] PDF upload and download and storage