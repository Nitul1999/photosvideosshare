const apik = require('../middleware/apikey');
const router=require('express').Router();
const apikmid=require('../middleware/apikey');           //importing middleware api 
const fpic=require('express-fileupload');
const fs = require("fs");
const flash = require('connect-flash');
const coki=require('cookie-parser');
const mysql=require('mysql');                 //importing mysql
const session=require('express-session');
 const bodyParser = require('body-parser');          //body parser is needed to parse or  to take data after submition like in  form
const { json } = require('body-parser');
const fileUpload = require('express-fileupload');
const bcrypt=require('bcrypt');
const saltRounds=10;
const path = require('path');
 router.use(bodyParser.urlencoded({ extended: true}))
 router.use(fileUpload());
 router.use(coki());
 router.use(flash());
 router.use(session({
      secret:'some secret',
      resave :false,
      saveUninitialized: true,
      cookie:{maxAge:1000 * 60 * 60 * 24},
      saveUninitialized:false
 }))                            //importing middlware for whole file
 router.use(bodyParser.json())                                           //writing one by one
const pool=mysql.createPool({          //create a pool or a area where database and details are there
    connectionLimit: 10,
    host:'localhost',
    user:'root',
    password:'',
    database:'stock_db'

})
router.get('/',(req,res)=>       
{
   if(req.session.loggedin){
    pool.getConnection((err, connection) => {
        if (err) throw err

        connection.query('SELECT * from picture',(err, rows) => {
            connection.release()
            if (!err) {
                res.render('index',{stat:'login',rows});
            } else {
                res.send('error');
            }
        }) 
   })
   }else{
    pool.getConnection((err, connection) => {
        if (err) throw err

        connection.query('SELECT * from picture',(err, rows) => {
            connection.release()
            if (!err) {
                res.render('index',{stat:'none',rows});
            } else {
                res.send('error');
            }
        }) 
   })
   }                                  
})
router.get('/video',(req,res)=>       
{
    if(req.session.loggedin){
        pool.getConnection((err, connection) => {
            if (err) throw err
    
            connection.query('SELECT * from video',(err, rows) => {
                connection.release()
                if (!err) {
                    res.render('index2',{stat:'login',rows});
                } else {
                    res.send('error');
                }
            }) 
       })
       }else{
        pool.getConnection((err, connection) => {
            if (err) throw err
    
            connection.query('SELECT * from video',(err, rows) => {
                connection.release()
                if (!err) {
                    res.render('index2',{stat:'none',rows});
                } else {
                    res.send('error');
                }
            }) 
       })
       }                                 
})
router.get('/signup',(req,res)=>       
{
   res.render('signup',{sign:""});                                  
})
router.post('/signup',(req,res)=>       
{
   pool.getConnection( (err, connection) => {
      if (err)
          throw err;

      // const {name,mail,password} = req.body
      const name = req.body.name;
      const email = req.body.email;
       const password = req.body.password;
      
       connection.query('SELECT * FROM user where username=?', [name], function (error, results) {
        connection.release();
        if (error)
            throw error;

        if (results.length > 0) {
            res.render('signup',{sign:"select different name"});
        }else if(results.length<=0){

      connection.query('SELECT * FROM user where email=?', [email], function (error, results) {
          if (error)
              throw error;
          console.log(results);
          if (results.length > 0) {
              res.render('signup',{sign:"email already used"});
          } else {
              connection.query('INSERT INTO user SET ?', ({ username: name, email: email, password: password }), (err, rows) => {
                  // return the connection to pool
                  if (!err) {
                      res.redirect('/login');
                  }

                  console.log('done', rows);

              });
          }
      });
  }});

});
})                                  
router.get('/login',(req,res)=>       
{
   const error = req.flash('text');           //here 'text' is a key for flash 
   if (req.session.loggedin) {
       res.redirect('/profile_pic')
   } else {
       res.render('login', { error })              // flash taking as object
   }                               
})
router.post('/login',(req,res)=>       
{
   pool.getConnection((err, connection) => {
      if (err)
          throw err;
      var email = req.body.email;
      var password = req.body.password;
      if (email && password) {
          connection.query('SELECT * FROM user WHERE email = ?', [email],function (error, results) {
           
              if (results.length > 0) {
                  connection.query('SELECT * FROM user WHERE password= ?', [password],function (error, results) {
                        connection.release();
                   if (results.length > 0) {
                      req.session.loggedin = true;
                      req.session.email = email;
                    //   res.render('profile_pic',{results});
                      res.redirect('/profile_user');
                  } else{
                      req.flash('text', 'wrong password try again'); //flash for error message with key 'text' and message ''wrong info'
                      res.redirect('/login');
                  }
             })
            }
             else {
                 req.flash('text', 'wrong info'); //flash for error message with key 'text' and message ''wrong info'
              res.redirect('/login');
            }
       })
      }
  });
})

router.get('/upload',(req,res)=>       
{
   if(req.session.loggedin){
    pool.getConnection((err, connection) => {
        if (err) throw err;
        console.log(req.session.email)
        connection.query('SELECT * from user where email=?',[req.session.email], (err, rows) => {
            connection.release()
            
            if (!err) {
                res.render('upload', {rows});
            } else {
                res.send('error');
            }
        })
    })    
   }else{
      res.redirect('login');
   }                                  
})
router.post('/upload',(req,res)=>{
    pool.getConnection((err, connection) => {
        let sampleFile;
        let uploadPath;
        console.log("posting");
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }
        console.log(req.session.email);
        // name of the input is sampleFile
        sampleFile = req.files.file;
        const extensionName = path.extname(sampleFile.name);
        console.log(extensionName);
        const allowedExtension = ['.png','.jpg','.jpeg'];
        if(extensionName=='.png'||extensionName=='.jpg'||extensionName=='.jpeg'){
        uploadPath = 'asset/pic/' + sampleFile.name;
        desc= req.body.details;
        title=req.body.title;
        id=req.body.id;
        // Use mv() to place file on the server
        sampleFile.mv(uploadPath, function (err) {
            if (err) return res.status(500).send(err);

          connection.query('INSERT into picture SET user_id=?,pic_name=?,pic_desc=?,type=?,pic_title=?', [id,sampleFile.name,desc,extensionName,title], (err, rows) => {
                connection.release()
                if (!err) {
                    res.redirect('/');
                } else {
                    console.log(err);
                }
            });
        })}else if(extensionName=='.mp4'){{
            uploadPath = 'asset/vid/' + sampleFile.name;
            desc= req.body.details;
            title=req.body.title;
            id=req.body.id;
            // Use mv() to place file on the server
            sampleFile.mv(uploadPath, function (err) {
                if (err) return res.status(500).send(err);
    
              connection.query('INSERT into video SET user_id=?,vid_name=?,vid_desc=?,type=?,vid_title=?', [id,sampleFile.name,desc,extensionName,title], (err, rows) => {
                    connection.release()
                    if (!err) {
                        res.redirect('/video');
                    } else {
                        console.log(err);
                    }
                });
            })
        }}else{
            res.send('error');
        }
        

    })
})
router.get('/profile_user',(req,res)=> {      
if (req.session.loggedin) {
   pool.getConnection((err, connection) => {
       if (err) 
       throw err;
       connection.query('SELECT * from user WHERE email=?', [req.session.email], (err, results) => {
           connection.release()
           console.log(results);
           if (!err) {
               res.render('profile_user', {results});
           } else {
               res.send('error');
           }
       })
   })
} else {
   res.send('log in please')
}                                    //res render is use for dynamic purpose
})

router.get('/profile_pic/:id',(req,res)=> {      
    if (req.session.loggedin) {
       pool.getConnection((err, connection) => {
           if (err) 
           throw err;
           connection.query('SELECT * from picture WHERE user_id=?', [req.params.id], (err, results) => {
               connection.release()
               console.log(results);
               if (!err) {
                   res.render('profile_pic', {results});
               } else {
                   res.send('error');
               }
           })
       })
    } else {
       res.send('log in please')
    }    
})
router.get('/pic_u/:id',(req,res)=> {      
    if (req.session.loggedin) {
       pool.getConnection((err, connection) => {
           if (err) 
           throw err;
           connection.query('SELECT * from picture WHERE user_id=?', [req.params.id], (err, results) => {
               connection.release()
               console.log(results);
               if (!err) {
                   res.render('pic_u', {results});
               } else {
                   res.send('error');
               }
           })
       })
    } else {
       res.send('log in please')
    }    
})
router.get('/profile_vid/:id',(req,res)=> {      
    if (req.session.loggedin) {
       pool.getConnection((err, connection) => {
           if (err) 
           throw err;
           connection.query('SELECT * from video WHERE user_id=?', [req.params.id], (err, results) => {
               connection.release()
               console.log(results);
               if (!err) {
                   res.render('profile_vid', {results});
               } else {
                   res.send('error');
               }
           })
       })
    } else {
       res.send('log in please')
    }    
})
router.get('/vid_u/:id',(req,res)=> {      
    if (req.session.loggedin) {
       pool.getConnection((err, connection) => {
           if (err) 
           throw err;
           connection.query('SELECT * from video WHERE user_id=?', [req.params.id], (err, results) => {
               connection.release()
               console.log(results);
               if (!err) {
                   res.render('vid_u', {results});
               } else {
                   res.send('error');
               }
           })
       })
    } else {
       res.send('log in please')
    }    
})
router.get('/pic_download/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;

        connection.query('SELECT * from picture where pic_id=?', [req.params.id], (err, rows) => {
            connection.release()
            rows.forEach(element => {
                //     console.log(element.picture)
                // })
                if (!err) {
                    res.download(path.join(__dirname, '../asset/pic', `${element.pic_name}`));
                } else {
                    console.log(err);
                }
            })
        });
    })       //to download       //to download
})
router.get('/vid_download/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;

        connection.query('SELECT * from video where vid_id=?', [req.params.id], (err, rows) => {
            connection.release()
            rows.forEach(element => {
                //     console.log(element.picture)
                // })
                if (!err) {
                    res.download(path.join(__dirname, '../asset/vid', `${element.vid_name}`));
                } else {
                    console.log(err);
                }
            })
        });
    })       //to download       //to download
})
router.get('/upd_pic/:id',(req,res)=>       
{
    if (req.session.loggedin) {
        pool.getConnection((err, connection) => {
            if (err) 
            throw err;
            connection.query('SELECT * from picture WHERE pic_id=?', [req.params.id], (err, results) => {
                connection.release()
                console.log(results);
                if (!err) {
                    res.render('profile_update_pic', {results});
                } else {
                    res.send('error');
                }
            })
        })
     } else {
        res.send('log in please')
     }    
 })  
router.post('/upd_pic/:id',(req,res)=>       
{
    if (req.session.loggedin) {
        pool.getConnection((err, connection) => {
            if (err) 
            throw err;
            const { pic_title, pic_desc } = req.body;
            console.log(req.params.id);
            connection.query('UPDATE picture SET  pic_title=?, pic_desc=? WHERE pic_id=? ', [pic_title,pic_desc,req.params.id], (err, results) => {
                connection.release()
                if (!err) {
                    res.redirect('/profile_user');
                } else {
                    res.send('error');
                }
            })
        })
     } else {
        res.send('log in please')
     }    
 }) 
 router.get('/upd_vid/:id',(req,res)=>       
{
    if (req.session.loggedin) {
        pool.getConnection((err, connection) => {
            if (err) 
            throw err;
            connection.query('SELECT * from video WHERE vid_id=?', [req.params.id], (err, results) => {
                connection.release()
                console.log(results);
                if (!err) {
                    res.render('profile_update_vid', {results});
                } else {
                    res.send('error');
                }
            })
        })
     } else {
        res.send('log in please')
     }    
 })   
 router.post('/upd_vid/:id',(req,res)=>       
{
    if (req.session.loggedin) {
        pool.getConnection((err, connection) => {
            if (err) 
            throw err;
            const { vid_title, vid_desc } = req.body;
            console.log(req.params.id);
            connection.query('UPDATE video SET  vid_title=?, vid_desc=? WHERE vid_id=? ', [vid_title,vid_desc,req.params.id], (err, results) => {
                connection.release()
                if (!err) {
                    res.redirect('/profile_user');
                } else {
                    res.send('error');
                }
            })
        })
     } else {
        res.send('log in please')
     }    
 })                           
router.get('/profile_vid',(req,res)=>       
{
   res.render('profile_vid');                                  
})
router.get('/admin_login',(req,res)=>{
   const error = req.flash('text');           //here 'text' is a key for flash 
   if (req.session.loggedin) {
       res.redirect('/admin_profile')
   } else {
       res.render('admin_login', { error })              // flash taking as object
   }  
})
router.post('/admin_login',(req,res)=>       
{
   pool.getConnection((err, connection) => {
      if (err)
          throw err;
      var name = req.body.name;
      var password = req.body.password;
      if (name && password) {
          connection.query('SELECT * FROM admin WHERE ad_name= ?', [name],function (error, results) {
           
              if (results.length > 0) {
                  connection.query('SELECT * FROM admin WHERE password= ?', [password],function (error, results) {
                        connection.release();
                   if (results.length > 0) {
                      req.session.loggedin = true;
                      req.session.name = name;
                      res.redirect('/admin_profile');
                  } else{
                      req.flash('text', 'wrong password try again'); //flash for error message with key 'text' and message ''wrong info'
                      res.redirect('/admin_login');
                  }
             })
            }
             else {
                 req.flash('text', 'wrong info'); //flash for error message with key 'text' and message ''wrong info'
              res.redirect('/admin_login');
            }
       })
      }
  });                             
})
router.get('/admin_profile',(req,res)=>       
{
   pool.getConnection((err, connection) => {
      if (err) throw err

      connection.query('SELECT * from user', (err, rows) => {
          connection.release()
          
          if (!err) {
              res.render('admin_profile', {rows})
          } else {
              res.send('error');
          }
      })
  })                                          
})
router.get('/picview/:id',(req,res)=>
{
    if(req.session.loggedin){
    pool.getConnection((err, connection) => {
        if (err) 
        throw err;
        connection.query('SELECT * from picture WHERE pic_id=?', [req.params.id], (err, results) => {
            connection.release()
            console.log(req.params.id);
            if (!err) {
                console.log(results.name)
                res.render('toview', {results,stat:'login'});
            } else {
                res.send('error');
            }
        })
    })
}else{
    pool.getConnection((err, connection) => {
        if (err) 
        throw err;
        connection.query('SELECT * from picture WHERE pic_id=?', [req.params.id], (err, results) => {
            connection.release()
            console.log(req.params.id);
            if (!err) {
                console.log(results.name)
                res.render('toview', {results,stat:'none'});
            } else {
                res.send('error');
            }
        })
    })
}
})
router.get('/vidview/:id',(req,res)=>
{
    if(req.session.loggedin){
    pool.getConnection((err, connection) => {
        if (err) 
        throw err;
        connection.query('SELECT * from video WHERE vid_id=?', [req.params.id], (err, results) => {
            connection.release()
            console.log(req.params.id);
            if (!err) {
                console.log("done")
                res.render('vidview', {results,stat:'login'});
            } else {
                res.send('error');
            }
        })
    })
}else{
    pool.getConnection((err, connection) => {
        if (err) 
        throw err;
        connection.query('SELECT * from video WHERE vid_id=?', [req.params.id], (err, results) => {
            connection.release()
            console.log(req.params.id);
            if (!err) {
                console.log("done")
                res.render('vidview', {results,stat:'none'});
            } else {
                res.send('error');
            }
        })
    })
}
})
router.get('/ad_req',(req,res)=>       
{
   res.render('ad_req_user');                                  
})
router.get('/user_info',(req,res)=>       
{
   res.render('ad_user_info');                                  
})
router.get('/del_pic/:id', (req, res) => {                         // delet is done by get not post
    pool.getConnection((err, connection) => {
        if (err) throw err; // not connected
                connection.query('DELETE FROM picture where pic_id=?', [req.params.id], (err, results) => {
                    connection.release()
                    res.redirect('back');
                });
            console.log('The data from user table: \n');
        });
})
router.get('/del_vid/:id', (req, res) => {                         // delet is done by get not post
    pool.getConnection((err, connection) => {
        if (err) throw err; // not connected
                connection.query('DELETE FROM video where vid_id=?', [req.params.id], (err, results) => {
                    connection.release()
                    console.log('done')
                    res.redirect('back');
                })
            console.log('The data from user table: \n');
        });
})
router.get('/del_u_pic/:id', (req, res) => {                         // delet is done by get not post
    pool.getConnection((err, connection) => {
        if (err) throw err; // not connected
                connection.query('DELETE FROM picture where pic_id=?', [req.params.id], (err, results) => {
                    connection.release()
                    res.redirect('/admin_profile');
                });
            console.log('The data from user table: \n');
        });
})
router.get('/del_u_vid/:id', (req, res) => {                         // delet is done by get not post
    pool.getConnection((err, connection) => {
        if (err) throw err; // not connected
                connection.query('DELETE FROM video where vid_id=?', [req.params.id], (err, results) => {
                    connection.release()
                    console.log('done')
                    res.redirect('/admin_profile');
                })
            console.log('The data from user table: \n');
        });
})
router.get('/del_user/:id', (req, res) => {                         // delete all
    pool.getConnection((err, connection) => {
        if (err) throw err; // not connected
        console.log('Connected!');
        // User the connection
        connection.query('DELETE FROM picture where user_id=?', [req.params.id], (err, rows) => {
            if(err) throw err;
            connection.query('DELETE FROM video where user_id=?', [req.params.id], (err, rows) => {
            if (!err) {
                connection.query('DELETE FROM user where user_id=?', [req.params.id], (err, rows) => {
                    connection.release()
                res.redirect('/admin_profile');
            })
            } else {
                console.log(err);
            }
            // console.log('The data from user table: \n');
        });
    })

    })
})
router.get('/logout', (req, res) => {
   if (req.session.loggedin) {
       req.session.destroy();
       res.redirect('/');
   } else {
       res.send('not log in')
   }
});
module.exports=router     
