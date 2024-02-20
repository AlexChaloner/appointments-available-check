const tryWebsite = require('./loadAppointmentsPage.js');
const nodemailer = require('nodemailer');

const returnValue = tryWebsite();

const email_username = process.env.EMAIL_USERNAME;
const email_password = process.env.EMAIL_PASSWORD;

if (returnValue) {
    console.log("Couldn't load website");
    // return;
}

let transporter = nodemailer.createTransport({
  service: 'outlook', // Use your preferred service
  auth: {
    user: email_username,
    pass: email_password
  }
});


const receivers = JSON.parse(process.env.RECEIVER_EMAILS);

console.log(receivers)

for (let receiver of receivers) {
    console.log(receiver)
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
