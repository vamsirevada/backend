const nodeMailer = require("nodemailer");

exports.sendEmail = (emailData) => {
  const transporter = nodeMailer.createTransport({
    host: "mail.privateemail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "admin@vanity.ac",
      pass: "$Arunhari7",
    },
  });
  return transporter
    .sendMail(emailData)
    .then((info) => console.log(`Message sent: ${info.response}`))
    .catch((err) => console.log(`Problem sending email: ${err}`));
};
