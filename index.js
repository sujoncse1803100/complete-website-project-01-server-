const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const port = 3001;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.send("welcome to doctors-portal")
    console.log('welcome to server.....');
})

const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ifk56.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const appoinmentCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_COLLECTION}`);

    app.post('/addAppoinment', (req, res) => {
        const appoinment = req.body;
        appoinmentCollection.insertOne(appoinment)
            .then(result => {
                res.send(result.acknowledged);
                console.log(result);
            })
    })

    app.post('/appoinmentByDate', (req, res) => {
        const date = req.body;
        appoinmentCollection.find({ date: date.date })
            .toArray((err, documents) => {
                res.send(documents);
                console.log(date.date);
            })
    })

});


app.listen(process.env.PORT || port);
