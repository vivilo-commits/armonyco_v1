import type { VercelRequest, VercelResponse } from '@vercel/node';
import sgMail from '@sendgrid/mail';

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

        const apiKey = process.env.SENDGRID_API_KEY;

        if (!apiKey) {
            console.warn('[Email] SENDGRID_API_KEY not found. Falling back to MOCK mode.');
            return res.status(200).json({
                success: true,
                message: 'MOCK: Email service not configured. Email would be sent to: ' + to
            });
        }

        sgMail.setApiKey(apiKey);

        const msg = {
            to,
            from: process.env.FROM_EMAIL || 'noreply@armonyco.com',
            subject: subject || 'Welcome to Armonyco!',
            html: generateWelcomeEmailHTML(data),
        };

        await sgMail.send(msg);

        console.log('[Email] Welcome email sent to:', to);
        return res.status(200).json({ success: true, message: 'Email sent' });

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
        .content { background: #f1f5f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #ffd700; color: #000; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0;">🎉 Welcome to Armonyco!</h1>
        </div>
        <div class="content">
            <h2 style="margin-top:0;">Hello ${data.firstName || 'there'},</h2>
            <p>Your account has been successfully created!</p>
            <p><strong>Plan:</strong> ${data.planName || 'Pro'}</p>
            <p><strong>Credits:</strong> ${(data.credits || 0).toLocaleString('en-US')} ArmoCredits©</p>
            <center style="margin: 30px 0;">
                <a href="${data.dashboardUrl || 'https://app.armonyco.com'}" class="button">Go to Dashboard</a>
            </center>
            <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                See you soon,<br>
                <strong>The Armonyco Team</strong>
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}
