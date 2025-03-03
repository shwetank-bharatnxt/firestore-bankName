const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp();

const db = admin.firestore();

exports.bankName = onRequest(
    { region: "asia-south1", cors: [/bharatnxt\.in$/] },
    async (req, res) => {
        try {
            const bearerToken = req.headers.authorization;
            if (bearerToken !== process.env.BEARER_TOKEN) {
                return res
                    .status(401)
                    .json({ success: false, message: "Unauthorized" });
            }

            const { vendors } = req.body;
            if (!Array.isArray(vendors) || vendors.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Vendors must be a non-empty array",
                });
            }

            const bankCollection = db.collection("bank_name_master");
            const snapshot = await bankCollection.get();

            let result = {};
            vendors.forEach((vendor) => {
                result[vendor] = null; // Default to null if not found
            });

            snapshot.forEach((doc) => {
                const bankName = doc.id;
                const bankData = doc.data();
                const bankVendors = bankData.vendor || [];

                vendors.forEach((vendor) => {
                    if (bankVendors.includes(vendor)) {
                        result[vendor] = bankName;
                    }
                });
            });

            return res.json(result);
        } catch (error) {
            console.error("Error fetching banks:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message,
            });
        }
    }
);
