const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const express = require('express');
const app = express()
const port = process.env.PORT;
const cors = require("cors");
app.use(cors());
app.use(express.json());
// app.use(express.json());


const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const db = client.db('systemapp');

        const dataCollections = db.collection('sports');
        const bookingCollections = db.collection('bookings');
        app.get('/sports', async (req, res) => {
            const cursor = dataCollections.find().limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/allsports', async (req, res) => {
            const cursor = dataCollections.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        // app.post('/bookings', async (req, res) => {
        //     const bookingData = req.body;
        //     const result = await bookingCollections.insertOne(bookingData).toArray();
        //     res.json(result);
        // })
        app.post('/sports', async (req, res) => {
            const facilityData = req.body;
            const result = await dataCollections.insertOne(facilityData)
            console.log(result);
            res.status(201).json({
                success: true,
                message: "Booking created successfully",
                data: result,
            });
        })
        app.post("/bookings", async (req, res) => {
            try {
                const bookingData = req.body;

                console.log("Received booking:", bookingData);

                const result = await bookingCollections.insertOne(bookingData);
                // res.send(result);
                res.status(201).json({
                    success: true,
                    message: "Booking created successfully",
                    data: result,
                });

            } catch (error) {
                console.error("Booking error:", error);

                res.status(500).json({
                    success: false,
                    message: "Booking failed",
                    error: error.message,
                });
            }
        });
        app.get('/allsports/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await dataCollections.findOne(query);
            res.send(result);
        });
        app.get('/bookings/:userId', async (req, res) => {
            const { userId } = req.params;
            const result = await bookingCollections.find({ userId: userId }).toArray();
            res.send(result);
        });
        app.delete("/bookings/:bookingId", async (req, res) => {
            const { bookingId } = req.params;
            const result = await bookingCollections.deleteOne({ _id: new ObjectId(bookingId) });
            res.json(result);
        });


        app.delete("/sports/:id", async (req, res) => {
            try {
                const { id } = req.params;

                const result = await dataCollections.deleteOne({
                    _id: new ObjectId(id),
                });

                if (result.deletedCount === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Facility not found",
                    });
                }

                res.status(200).json({
                    success: true,
                    message: "Facility deleted successfully",
                });

            } catch (error) {
                console.error("Delete facility error:", error);

                res.status(500).json({
                    success: false,
                    message: "Failed to delete facility",
                });
            }
        });

        app.patch("/sports/:id", async (req, res) => {
            try {
                const { id } = req.params;

                const updatedFacility = req.body;

                const result = await dataCollections.updateOne(
                    {
                        _id: new ObjectId(id),
                    },
                    {
                        $set: updatedFacility,
                    }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Facility not found",
                    });
                }

                res.status(200).json({
                    success: true,
                    message: "Facility updated successfully",
                    data: result,
                });

            } catch (error) {
                console.error("Update facility error:", error);

                res.status(500).json({
                    success: false,
                    message: "Failed to update facility",
                });
            }
        });
        app.get("/myfacilities/:email", async (req, res) => {
            try {
                const { email } = req.params;

                const result = await dataCollections
                    .find({
                        ownerEmail: email,
                    })
                    .toArray();

                res.send(result);

            } catch (error) {
                console.error(error);

                res.status(500).json({
                    success: false,
                    message: "Failed to get facilities",
                });
            }
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})