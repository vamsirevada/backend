const nodeMailer = require('nodemailer');

exports.sendEmail = (emailData) => {
  const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
      user: `${process.env.EMAIL_USER}`,
      pass: `${process.env.EMAIL_PASS}`,
    },
  });
  return transporter
    .sendMail(emailData)
    .then((info) => console.log(`Message sent: ${info.response}`))
    .catch((err) => console.log(`Problem sending email: ${err}`));
};
