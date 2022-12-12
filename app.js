//CARREGANDO MÓDULOS
    const express = require ('express')
    const handlebars = require ('express-handlebars')
    const boryParser = require ("body-parser")
    const app = express()
    const admin = require("./routes/admin")
    const path = require("path")
    const mongoose = require ("mongoose")
    const session = require("express-session")
    const flash = require("connect-flash")
    require("./models/Postagem")
    const Postagem = mongoose.model("postagens")
    require("./models/Categoria")
    const Categoria = mongoose.model("categorias")
    const usuarios = require("./routes/usuario")
    const passport = require("passport")
    require("./config/auth")(passport)
   
    
    const port = process.env.PORT || 8089;

//CONFIGURAÇOES
app.use('/public', express.static('public'))
    //SESSÃO
       app.use(session({
        secret:"amora",
        resave: true,
        saveUninitialized: true
       }))
       app.use(passport.initialize())
       app.use(passport.session())
       app.use(flash())
    //MIDDLEWARE
       app.use((req,res,next)=>{
            res.locals.success_msg = req.flash("success_msg")
            res.locals.error_msg = req.flash("erre_msg")
            res.locals.error = req.flash("error")
            res.locals.user = req.user || null;
            next()
       })    
       
    //BORY PARSER
       app.use(boryParser.urlencoded({extended: true})) 
       app.use(boryParser.json()) 
    //HANDLEBARS
       app.set('view engine','handlebars');
       app.engine('handlebars',handlebars.engine({layoutDir: __dirname + '/views/layouts',})) 
       
    //MONGOOSE
        mongoose.Promise = global.Promise    
        mongoose.connect("mongodb://localhost/metaverse").then(()=>{
            console.log("Conectado ao mongo")
        }).catch((err)=>{
            console.log("Erro ao se conectar" + err)
        })

    //PUBLIC
       app.use(express.static(path.join(__dirname,"public")))
       app.use('/public', express.static('public'))
//ROTAS
       app.get('/',(req,res)=>{
        res.sendFile(__dirname+"/index.html")
       })
       app.get('/postagem',(req,res)=>{
        Postagem.find().lean().populate("categoria").sort({data:"desc"}).then((postagens)=>{
            res.render("principal",{postagens: postagens})
        }).catch((err)=>{
            req.flash("error_msg","houve um erro interno")
            res.redirect("/404")
        })

       })

       app.get("/postagem/:slug",(req,res)=>{
        Postagem.findOne({slug:req.params.slug}).lean().then((postagem)=>{
            if(postagem){
                res.render("postagem/principal", {postagem: postagem})
            }else{
                req.flash("error_msg","Esta postagem não existe")
                res.redirect("/")
            }
        }).catch((err)=>{
            req.flash("error_msg", "houve um erro interno")
            res.redirect("/")
        })
    })

       app.get("/categorias",(req,res)=>{
            Categoria.find().lean().then((categorias)=>{
                res.render("categoria/index",{categorias:categorias})


            }).catch((err)=>{
                req.flash("error_msg", "Houve um erro interno ao listar as categorias")
                res.redirect("/")
            })

       })
       
       app.get("/categorias/:slug",(req, res)=>{
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria)=>{
            if(categoria){
                
                Postagem.find({categoria: categoria._id}).lean().then((postagens)=>{

                    res.render("categoria/postagens",{postagens: postagens, categoria: categoria})

                }).catch((err)=>{
                    req.flash("error_msg", "Houve um erro ao listar os posts")
                    res.redirect("/")
                })

            }else{
                req.flash("error_msg", "Esta categoria não existe")
                res.redirect("/")    
            }

        }).catch((err)=>{
            req.flash("error_msg", "Houve um erro interno ao carregar a pagina desta categoria")
            res.redirect("/")
        })
       })

       app.get("/404",(req, res)=>{
        res.send('Erro 404!')
    })

    app.get("/registro", (req, res)=>{
        res.render('main', {layout: 'registro'})
    })
    
    app.get('usuarios/login',(req,res)=>{
        res.sendFile(__dirname+"usuarios/registro")
       })
       app.get('/',(req,res)=>{
        res.sendFile(__dirname+"usuarios/login")
       })

       app.use('/admin',admin)
       app.use("/usuarios",usuarios)
       
     

//OUTROS
const PORT = 8089

app.listen(PORT,()=>{
    console.log("Servidor rodando!")
})