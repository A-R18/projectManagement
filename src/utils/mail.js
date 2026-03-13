import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Project Tracker",
      link: "https://projecRackerlink.com",
    },
  });
  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

  const emailHTML = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.projecracker@PT.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHTML,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error(
      "Email service failed due to provision of wrong/incomplete MAILTRAP credentials!\n",
    );
    console.error("Error", error);
  }
};

const verificationMailContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome, lovely to have you on board!",
      action: {
        instructions: "To verify email please cick on following button:",
        button: {
          color: "#c5701c",
          text: "Verify Email",
          link: verificationUrl,
        },
      },
      outro: "Need help, or have questions, reply on this email, here to help anytime!",
    },
  };
};

const forgotPasswordContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "Password reset request for your account",
      action: {
        instructions: "To reset your password click on following button",
        button: {
          color: "#053108",
          text: "Verify Email",
          link: passwordResetUrl,
        },
      },
      outro: "Need help, or have questions, reply on this email, here to help anytime! ",
    },
  };
};

export { forgotPasswordContent, verificationMailContent, sendEmail };
