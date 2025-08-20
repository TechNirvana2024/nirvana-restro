const nodemailer = require("nodemailer");
const { smtpModel } = require("../models");
const generalConstant = require("../constants/general-constant");

const {
  getActiveTemplate,
  replacePlaceholders,
} = require("../helpers/get-active-email-template");

/**
 * sendMail - a function that fetches the active template by actionKey,
 *            replaces placeholdgeneralers, and sends the email.
 *
 * @param {string} actionKey - e.g. 'verify_mail', 'approval', 'reject'
 * @param {object} replacements - object containing placeholders => values
 * @param {string} recipientEmail - the user's email address
 *
 * @return {Promise<string>} - messageId from nodemailer
 */
const sendMail = async (actionKey, replacements, recipientEmail) => {
  const smtpConf = await smtpModel.findOne();
  if (!smtpConf) {
    return {
      ...generalConstant.EN.SMTP.SMTP_GET_FAILURE,
      data: null,
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpConf.host || "smtp.gmail.com",
    port: smtpConf.port || 465,
    secure: smtpConf.secure || true,
    auth: {
      user: smtpConf.username,
      pass: smtpConf.passkey,
    },
  });

  const template = await getActiveTemplate(actionKey);

  // 2. Replace placeholders in subject & body
  const finalSubject = replacePlaceholders(template.subject, replacements);
  const finalBody = replacePlaceholders(template.body, replacements);

  // 3. Send mail with nodemailer
  const info = await transporter.sendMail({
    from: template.from || process.env.EMAIL_USERNAME,
    to: recipientEmail,
    subject: finalSubject,
    // If your template is HTML, use 'html'
    html: finalBody,
    // If you want to add an alternate text, replace placeholders there as well:
    text: replacePlaceholders(template.alternateText, replacements),
  });

  return info.messageId;
};

module.exports = { sendMail };
