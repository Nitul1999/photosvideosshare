const router=require('express').Router()
let prod=require('../producData');

router.get('/toview',(req,res)=>
{
    //res.sendFile(path.resolve(__dirname,'gallery.html'))
    res.render('toview');
})

module.exports=router;