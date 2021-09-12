import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt-nodejs';
import cors from 'cors'; //// cors allows us to use enable the passowrd vision on the browser
import knex from 'knex';

//import signin from './controllers/signin.js';
//import register from './controllers/register.js';

//import profile from './controllers/profile.js';
//import image from './controllers/image.js';

// knex allows me to connect to my database 
const db = knex ({
    client: 'pg',
    connection: {
      host : '127.0.0.1', //default localhost home (port 3000) which is the port of the database 
      user : 'postgres', //name of my postgresql user
      password : 'Test', //password to my database
      database : 'smart-brain' //name of my database
    }
  });


//EXPRESS
const app = express();

app.use(bodyParser.json());
app.use(cors());


app.get('/', (req, res) =>{ //this is the root route
    res.send('success');
})

//SIGNIN
app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password){ // if any of those is empty 
        return res.status(400).json('incorrect form submission');
    }
    db.select('email', 'hash').from('login')
  .where('email', '=', email)
  .then(data =>{
      const isValid= bcrypt.compareSync(req.body.password, data[0].hash);
      if (isValid){
         return db.select('*').from('users')
          .where('email', '=', email)
          .then(user => {
              res.json(user[0]) 
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
      res.status(400).json('wrong credentials')
      }
  })
  .catch(err => res.status(400).json('wrong email or password'))
});

//REGISTER
app.post('/register', (req, res) => { 
    const { email, name, password } = req.body;
if (!email || !name || !password){ // if any of those is empty 
    return res.status(400).json('incorrect form submission');
}
const hash = bcrypt.hashSync(password)
db.transaction(trx =>{
    trx.insert({
        hash: hash,
        email: email
    })
        .into ('login')
        .returning('email')
        .then ( loginEmail => {
            return trx('users')
            .returning('*') //returning all users
            .insert({
              email: loginEmail[0], //from body
              name: name, //from body
              joined: new Date() // }).then(console.log)
          })
             .then(user => {
              res.json(user[0]); //this returns as a response the user we just created, which is the last user
          })
        })
        .then(trx.commit)
        .catch(trx.rollback)
}) 
 .catch(err => res.status(400).json("Unable to register")) //if there is any error such as a repeat of an item as restricted in your database it returns this error
//res.json(database.users[database.users.length-1]); //this returns as a response the user we just created, which is the last user
});

//PROFILE
//we are not using this, however, we might need this knowledge in future
app.get('/profile/:id', (req, res) => { const { id } = req.params;
db.select('*').from ('users').where ({
    id: id
})
  .then(user =>{
      if (user.length){
    res.json(user[0]);
    } else {
        res.status(400).json("User not found")
    }
})
.catch(err => res.status(400).json("Error getting User"))
});


//IMAGE
app.put('/image', (req, res) => {
  const { id } = req.body;
db('users').where('id', '=', id) //where id is equal the id received on the body
.increment( 'entries', 1)
.returning('entries')
.then(entries => {
    res.json(entries[0]);
})
.catch(err => res.status(400).json("Unable to get entries"))
});


//LISTENING
app.listen(4000, () => {
    console.log('app is running on port 4000');
})  

// PLAN FOR THE API
// --> res = this is working
//signin --> POST =success/fail
//register --> POST =user
//profile/:userid --> GET = user
//image --> PUT --> UPDATED USER OBJECT
//