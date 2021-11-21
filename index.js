const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra'); // file-system....npm install fs-extra
const fileUpload = require('express-fileupload');
const cors = require('cors');
require('dotenv').config();

const port = 3001;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('doctors'));
app.use(fileUpload());

app.get('/', (req, res) => {
    res.send("welcome to doctors-portal")
    console.log('welcome to server.....');
})

const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ifk56.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const appoinmentCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_COLLECTION}`);
    const doctorsCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_DOCTOR_COLLECTION}`);

    app.post('/addAppoinment', (req, res) => {
        const appoinment = req.body;
        appoinmentCollection.insertOne(appoinment)
            .then(result => {
                res.send(result.acknowledged);
                // console.log(result);
            })
    })

    app.post('/appoinmentByDate', (req, res) => {
        const date = req.body;
        const email = req.body.email;

        doctorsCollection.find({ email: email })
            .toArray((err, doctors) => {
                const filter = { date: date.date };

                if (doctors.length === 0) {
                    filter.email = email;
                }

                appoinmentCollection.find(filter)
                    .toArray((err, documents) => {
                        // console.log(email, date.date, doctors, documents);
                        res.send(documents);
                    })
            })
    })

    app.get('/patients', (req, res) => {
        appoinmentCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
                // console.log(documents.length);
            })
    })

    app.post('/addDoctors', async (req, res) => {
        const name = req.body.name;
        const email = req.body.email;
        const phone = req.body.phone;
        const file = req.files.file;

        const filePath = `${__dirname}/doctors/${file.name}`;
        file.mv(filePath, err => {
            if (err) {
                console.log(err);
                res.status(500).send({ msg: 'failed to upload your image' });
            }

            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');

            var image = {
                contentType: req.files.file.mimeType,
                size: req.files.file.size,
                img: Buffer(encImg, 'base64')
            }

            const doctor = {
                name: name,
                email: email,
                phone: phone,
                image: image
            }

            doctorsCollection.insertOne(doctor)
                .then(result => {
                    fs.remove(filePath, errors => {
                        if (errors) {
                            console.log(errors);
                            res.status(500).send({ msg: 'failed to remove your image' });
                        }
                        res.send(result.acknowledged);
                        // console.log(result);
                    })

                })
        })

    })

    app.get('/doctors', (req, res) => {
        doctorsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
                // console.log(documents.length);
            });
    })

    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;

        doctorsCollection.find({ email: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0);
                // console.log(doctors.length);
            })
    })



});


app.listen(process.env.PORT || port);
