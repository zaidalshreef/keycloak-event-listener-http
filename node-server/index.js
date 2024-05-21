import dotenv from 'dotenv';
import express, { json, urlencoded } from 'express';
import 'axios';
import axios from 'axios';
import { exec } from 'child_process';

dotenv.config();
const app = express();

const TENANT_ID = process.env.TENANT_ID;
const REPOSITORY_ID = process.env.REPOSITORY_ID;

// Add middleware to parse JSON and urlencoded request bodies
app.use(json());
app.use(urlencoded({ extended: true }));

// Function to fetch access token using a shell command
const fetchAccessToken = () => {
    return new Promise((resolve, reject) => {
        const command = `curl -k -s -H "Content-Type: application/json" -H "Authorization: Basic dGVuYW50Og==" -X POST "http://auth-service:40010/oauth/token?grant_type=client_credentials&client_id=tenant&client_secret=" | grep -Po '"access_token":"\\K[^"]*'`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }
            resolve(stdout.trim());
        });
    });
};
// Handle POST requests to the '/keycloak-events' endpoint
app.post('/keycloak-events', async (req, res) => {
    const event = req.body;
    console.log('Event received:', event);

    // Extract data from the webhook event
    const { id, email, userName, firstName, lastName, attributes } = event;

    // Prepare the catalogItem data for the API request
    const catalogItem = {
        id: id, 
        stereotype: 'ET_PERSON',
        catalogState: 'APPROVED', // Assuming a default state
        attributes: [
            {
                stereotype: 'AT_NAME',
                attributeValues: [
                    {
                        stereotype: 'AT_NAME',
                        dataType: 'Text',
                        locale: 'en',
                        value: attributes.name
                    },
                    {
                        stereotype: 'AT_NAME',
                        dataType: 'Text',
                        locale: 'ar',
                        value: attributes.nameA
                    }
                ]
            }
        ]
    };

    console.log('Prepared catalogItem:', catalogItem);

    try {
        const token = await fetchAccessToken();
        const response = await axios.post(
            `http://domain-service:40019/api/tenants/${TENANT_ID}/repositories/${REPOSITORY_ID}/stages/common/catalogItems`,
            JSON.stringify(catalogItem), // Convert the entity to JSON string
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        console.log('catalogItems created successfully:', response.data);
        res.status(201).send('Event processed and catalogItems created successfully');
    } catch (error) {
        console.error('Error creating entity:', error);
        res.status(500).send('Error processing event');
    }
});


// Start the server and listen on the specified port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});