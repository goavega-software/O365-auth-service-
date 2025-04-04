import express from "express";
import axios from 'axios';
import dotenv from "dotenv";
import { connectDB } from "../config/database-config.js";
import { serverConfig } from '../config/server-config.js';

dotenv.config();
const router = express.Router();
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const redirectUri = process.env.REDIRECT_URI;
const adminPassword = process.env.HESK_ADMIN_PASSWORD;
const customerPassword = process.env.HESK_USER_PASSWORD;
const authority = `https://login.microsoftonline.com/${tenantId}`;
const scopes = ['openid'];
const { apacheBaseUrl, heskBaseUrl } = serverConfig;

const createCustomer = async (mail, displayName) => {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

    const urlencoded = new URLSearchParams({
        name: displayName,
        email: mail,
        password: customerPassword,
        'confirm-password': customerPassword
    });
    await fetch(`${heskBaseUrl}/register.php`, {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow'
    });
}

const handleLogin = async (endpoint, credentials) => {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
    const urlencoded = new URLSearchParams(credentials);

    const response = await fetch(`${heskBaseUrl}/${endpoint}`, {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'manual',
    });
    return response.headers.getSetCookie();
};

const handleAdminLogin = async (adminName) => {
    return handleLogin('admin/index.php', { user: adminName, pass: adminPassword, a: 'do_login' });
};

const handleCustomerLogin = async (mail) => {
    return handleLogin('login.php', { email: mail, password: customerPassword, a: 'login' });
};

const getUserProfile = async (code) => {
    const tokenUrl = `${authority}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('scope', scopes.join(' '));
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');
    params.append('client_secret', clientSecret);

    const response = await axios.post(tokenUrl, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    const profileResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
            Authorization: `Bearer ${response.data.access_token}`,
        },
    });

    return profileResponse.data
}

router.get('/auth/microsoft', async (req, res) => {
    try {
        const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?
        client_id=${clientId}
        &response_type=code
        &redirect_uri= ${redirectUri}
        &response_mode=query
        &scope=openid`

        res.redirect(authUrl);
    } catch (error) {
        console.error('Error in Microsoft Auth:', error);
        res.status(500).json({ message: 'Authentication failed' });
    }
});


router.get('/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Authorization code is missing.');
    }

    try {
        const userProfile = await getUserProfile(code)

        if (userProfile) {
            const { mail, displayName } = userProfile;

            try {
                const db = await connectDB();
                const [admins] = await db.query('SELECT email FROM `hesk_users`');
                const adminUser = admins.find(({ email }) => email == mail);

                if (adminUser) {
                    const [adminName] = mail.split('.');
                    const cookies = await handleAdminLogin(adminName)
                    if (cookies)
                        res.setHeader("Set-Cookie", cookies);
                    res.redirect(`${apacheBaseUrl}/admin/admin_main.php`);
                    return;
                }

                const [customers] = await db.query('SELECT email FROM `hesk_customers`');
                const customerExist = customers.find(({ email }) => email == mail);

                if (!customerExist) {
                    await createCustomer(mail, displayName);
                }
                const cookies = await handleCustomerLogin(mail)
                if (cookies)
                    res.setHeader("Set-Cookie", cookies);
                res.redirect(`${apacheBaseUrl}/index.php`);
                return
            } catch (e) {
                console.error('error', e);
            }
        }
    } catch (error) {
        console.error('Error during token exchange:', error.response ? error.response.data : error.message);
        res.status(500).send('Authentication failed.');
    }
});


export default router;
