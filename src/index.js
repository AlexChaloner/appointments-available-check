const tryWebsite = require('./loadAppointmentsPage.js');
const nodemailer = require('nodemailer');
const fs = require('fs');



async function poll() {
    const websiteFailed = await tryWebsite();

    const email_username = process.env.SENDER_EMAIL_USERNAME;
    const email_password = process.env.SENDER_EMAIL_PASSWORD;
    
    if (websiteFailed) {
        console.log("Couldn't load website");
        return;
    } else {

        // Path to your .pem formatted certificate
        const certificatePath = 'certificates/certificate.pem';

        // Read the certificate file
        const caCertificate = fs.readFileSync(certificatePath);

        let transporter = nodemailer.createTransport({
            service: 'hotmail', // Use your preferred service
            auth: {
                user: email_username,
                pass: email_password
            },
            tls: {
                // Provide the CA certificate
                ca: caCertificate
            }
        });
        
        const receivers = JSON.parse(process.env.RECEIVER_EMAILS);
        
        console.log(receivers);
        
        for (let receiver of receivers) {
            console.log(receiver);
            let mailOptions = {
                from: email_username,
                to: receiver,
                subject: 'Possible appointment available',
                text: 'That was easy!'
            };
                
            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    }

    
}

poll();
