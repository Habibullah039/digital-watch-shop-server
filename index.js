const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY) ;
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;


// const corsConfig = {
//   origin: '',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE']
// }
// app.use(cors(corsConfig))
// app.options("", cors(corsConfig))
// https://dev.to/shafia/some-common-vercel-errors-548i

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.asucufz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true, } });





function verifyJWT(req, res, next) {
  const authHeaders = req.headers.authorization;

  if (!authHeaders) {
    return res.status(401).send({ message: 'unauthorized access' });
  }

  const token = authHeaders.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'forbidden access' });
    }

    // console.log('decoded' , decoded) ;
    req.decoded = decoded;
    next();
  })



}





async function run() {

  try {
    
    const classicWatchCollection = client.db("Digital-Watch-Shop").collection("classicWatch");
    const modernWatchCollection = client.db("Digital-Watch-Shop").collection("modernWatch");
    const specialWatchCollection = client.db("Digital-Watch-Shop").collection("specialWatch");
    const orderCollection = client.db("Digital-Watch-Shop").collection("order");
    const userCollection = client.db("Digital-Watch-Shop").collection("user");
    const paymentCollection = client.db("Digital-Watch-Shop").collection("payment");
    



    // ..................Auth...............

    app.post('/login', async (req, res) => {

      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '1d'
      });

      res.send({ accessToken });

    })

    // ....................................




    app.get('/classicWatch', async (req, res) => {
      const query = {};
      const cursor = classicWatchCollection.find(query);
      const classic = await cursor.toArray();
      res.send(classic);

    })


    app.get('/modernWatch', async (req, res) => {
      const query = {};
      const cursor = modernWatchCollection.find(query);
      const modern = await cursor.toArray();
      res.send(modern);

    })


    app.get('/specialWatch', async (req, res) => {
      const query = {};
      const cursor = specialWatchCollection.find(query);
      const special = await cursor.toArray();
      res.send(special);

    })




    app.get('/order', verifyJWT, async (req, res) => {


      // const authHeader =req.headers.authorization;
      // console.log(authHeader);
      const decodedEmail = req.decoded.email;
      const email = req.query.email;

      if (decodedEmail === email) {

        const query = { email: email };
        const cursor = orderCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);

      }

      else {
        return res.status(403).send({ message: 'forbidden access' });
      }


    })




    app.get('/classicWatch/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classicWatchCollection.findOne(query);
      res.send(result);


    })


    app.get('/modernWatch/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await modernWatchCollection.findOne(query);
      res.send(result);


    })

    app.get('/specialWatch/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await specialWatchCollection.findOne(query);
      res.send(result);


    })




    // ...................\\\\.....................




    app.post('/order', async (req, res) => {

      const order = req.body;
  
      const result = await orderCollection.insertOne(order);
      res.send(result)


    })


    app.post('/signup', async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);

    })

   



    // ....................\\\\\\\\\\\\\\\...........................

    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    })



    app.post("/create-payment-intent", verifyJWT,  async (req, res) => {
      const { price } = req.body;
      const amount = price * 100 ;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card'] 
      });

      res.send({

        clientSecret: paymentIntent.client_secret

      })

    })



    app.post("/payments", verifyJWT, async (req, res) => {

      const payment = req.body;
      const insertResult = await paymentCollection.insertOne(payment);
      const query = {_id :{ $in: payment.items.map(id => new ObjectId(id) )}} ;
      const deleteResult = await orderCollection.deleteMany(query) ;
      res.send({insertResult , deleteResult}) ;


    })



  }
  

  finally {

  }

}


run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Welcome to Digital Watch shop')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})