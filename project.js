const express=require('express');
const ap=express();
const apik = require('./middleware/apikey');
const mainrout=require('./route/mainrout');   //using for routing all files instead of writing multiple time ap.get etc in this file
const fileUpload = require('express-fileupload');
const port=process.env.port||7000;
//const apikmid=require('./middleware/apikey');    //importing globally middleware
ap.set('view engine','ejs');            // view engine is key and ejs is path
//console.log(ap.get('view engine'));                                        //js engine templt

ap.use(express.static('asset'))                            //contain react static
ap.use(express.json())
ap.use(mainrout);
ap.use(fileUpload());


//ap.use('/home',mainrout);    //can be use as prefix e.g if we type 'localhost:3000/home' then the index page will appear and other pages can be access by home/pagename
ap.listen(port,()=>
{
    console.log(`listening port ${port}`)
})
