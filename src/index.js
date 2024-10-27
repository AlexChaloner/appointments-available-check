const tryWebsite = require('./loadAppointmentsPage.js');
const nodemailer = require('nodemailer');
const fs = require('fs');

const EventEmitter = require('events');
class AppointmentEmitter extends EventEmitter {}
const appointmentEmitter = new AppointmentEmitter();

// To prevent spamming
receivedEmailToggle = false

// Listen for the event
appointmentEmitter.on('appointmentFound', (data) => {
  console.log(`Received data: ${data}`);
  if (data === true) {
    if (!receivedEmailToggle) {
        receivedEmailToggle = true
        sendEmail();
    }
  } else {
    receivedEmailToggle = false
  }
});

function sendEmail(repeats=0) {
    const email_username = process.env.SENDER_EMAIL_USERNAME;
    const email_password = process.env.SENDER_EMAIL_PASSWORD;

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
    
    let mailOptions = {
        from: email_username,
        to: receivers,
        subject: 'Possible appointment available',
        text: 'Not guaranteed.'
    };
        
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log("Email was not sent");
            console.log(error);
            if (repeats < 10) {
                sendEmail(repeats + 1);
            }
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

tryWebsite(appointmentEmitter, 'de', ['2556030']);
// tryWebsite(appointmentEmitter, 'be', ['1013950']);
