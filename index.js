const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const express = require('express');
const app = express()
const port = process.env.PORT;
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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
        const verifyToken = async (req, res, next) => {
            const JWKS = createRemoteJWKSet(
                new URL('http://localhost:3000/api/auth/jwks')
            )
            const authHeader = req?.headers?.authorization
            if (!authHeader) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const token = authHeader.split(" ")[1];
            if (!token) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            try {
                const { payload } = await jwtVerify(token, JWKS)
                console.log(payload);
                next();

            } catch (error) {
                return res.status(403).json({ message: "forbidden" })
            }
            // console.log(token);
            // console.log(authHeader);
            // conso\.log()


        }
        app.get('/sports', async (req, res) => {
            const cursor = dataCollections.find().limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });
        // app.get('/allsports', async (req, res) => {
        //     const cursor = dataCollections.find();
        //     const result = await cursor.toArray();
        //     res.send(result);
        // });
        //here change
        app.get("/allsports", async (req, res) => {
            try {
                const { search = "", sportType = "" } = req.query;

                const query = {};

                // Search
                if (search.trim()) {
                    query.facilityName = {
                        $regex: search.trim(),
                        $options: "i"
                    };
                }

                // Filter
                if (sportType) {
                    const sportMap = {
                        Badminton: ["Badminton Court"],

                        Football: ["Football Turf"],

                        Tennis: [
                            "Tennis Court",
                            "Tennis",
                            "tennis"
                        ],

                        Swimming: [
                            "Swimming Pool",
                            "summing pool"
                        ],

                        Cricket: ["Cricket Ground"],

                        Futsal: ["Futsal Court"],

                        Basketball: ["Basketball Court"],

                        Gym: ["Gym"]
                    };

                    const selectedTypes = sportMap[sportType];

                    if (selectedTypes) {
                        query.facilityType = {
                            $in: selectedTypes
                        };
                    }
                }

                console.log("QUERY:", query);

                const result = await dataCollections
                    .find(query)
                    .toArray();

                res.status(200).send(result);

            } catch (error) {
                console.error("GET ALL SPORTS ERROR:", error);

                res.status(500).send({
                    message: "Failed to fetch facilities",
                    error: error.message
                });
            }
        });

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
        app.get('/allsports/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await dataCollections.findOne(query);
            res.send(result);
        });
        app.get('/bookings/:userId', verifyToken, async (req, res) => {
            const { userId } = req.params;
            const result = await bookingCollections.find({ userId: userId }).toArray();
            res.send(result);
        });
        app.delete("/bookings/:bookingId", verifyToken, async (req, res) => {
            const { bookingId } = req.params;
            const result = await bookingCollections.deleteOne({ _id: new ObjectId(bookingId) });
            res.json(result);
        });


        app.delete("/sports/:id", verifyToken, async (req, res) => {
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

        app.patch("/sports/:id", verifyToken, async (req, res) => {
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