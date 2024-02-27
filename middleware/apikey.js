function apik(req,res,next){
    const api_key='hm';
    console.log(req.query.api_key);   //req.body or query  use for requesting inside body
    if(req.query.api_key&&(req.query.api_key===api_key)){          //to check if user api key exist 
        next();                                                 //to end a req to move to next otherwise a request will not complete

    }else{
        res.json({message:'not allowed'});
    } 
}
module.exports=apik;