/**
 * Vercel Serverless Function
 * Send welcome email after registration
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// IMPORTANT: Install an email service (e.g. SendGrid, Resend, AWS SES)
// npm install @sendgrid/mail
// import sgMail from '@sendgrid/mail';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, subject, data } = req.body;

        if (!to || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // IMPORTANT: Uncomment when you have configured SendGrid
        /*
        sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

        const msg = {
            to,
            from: process.env.FROM_EMAIL || 'noreply@armonyco.com',
            subject: subject || 'Welcome to Armonyco!',
            html: generateWelcomeEmailHTML(data),
        };

        await sgMail.send(msg);

        console.log('[Email] Welcome email sent to:', to);
        return res.status(200).json({ success: true, message: 'Email sent' });
        */

        // MOCK RESPONSE per sviluppo
        console.log('[Email] MOCK - Welcome email for:', to);
        console.log('[Email] Data:', data);
        
        return res.status(200).json({ 
            success: true, 
            message: 'MOCK: Email service not configured. Email would be sent to: ' + to 
        });
    } catch (error: any) {
        console.error('[Email] Error sending welcome email:', error);
        return res.status(500).json({ 
            error: 'Failed to send email',
            message: error.message 
        });
    }
}

function generateWelcomeEmailHTML(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #ffd700; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #ffd700; color: #000; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Armonyco!</h1>
        </div>
        <div class="content">
            <h2>Hello ${data.firstName},</h2>
            <p>Your account has been successfully created!</p>
            <p><strong>Plan:</strong> ${data.planName}</p>
            <p><strong>Credits:</strong> ${data.credits.toLocaleString('en-US')} ArmoCredits©</p>
            <center>
                <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
            </center>
            <p style="margin-top: 30px;">
                See you soon,<br>
                <strong>The Armonyco Team</strong>
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

