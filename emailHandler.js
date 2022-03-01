/**
 * The EmailHandler is for sending emails to the owner.
 * Typically this is for errors or bot shutting down. Occasionally the `notify` command.
 *
 * For other developers: This email handler is setup for a roundcube/webmail setup.
 * Chances are it won't be an easy to copy/paste your setup so I suggest reading the docs for nodemailer: https://nodemailer.com/about/
 */
const nodemailer = require("nodemailer");

class emailHandler{
    constructor(savedData){
        log(6, "EmailHandler: READY.");

        this.exit = savedData.useEmailHandler.toString().toLowerCase() !== "true";
        this.sender = savedData.sender;
        this.receiver = savedData.receiver;
        this.host = savedData.host;
        this.port = savedData.port;
        this.auth = {
            user: savedData.auth.user,
            pass: savedData.auth.pass
        };
        if(this.exit) return;
        this._transporter = nodemailer.createTransport({
            host: this.host,
            port: this.port,
            secure: this.port === 465,
            auth: this.auth
        });
    }

    /**
     * Sends ALL the errors tracked to the owner in a single email.
     * @param {Object[]}errors
     * @return {Promise<null>}
     */
    sendShutoff(errors){
        return new Promise((cb, rj) => {
            if(this.exit){
                log(6, "Cannot sendShutoff email due to emailHandler disabled.");
                cb();
            }
            this.transporter.sendMail({
                from: `"Dreamland-BOT" <${this.sender}>`,
                to: this.receiver,
                subject: `[BOT] SHUTDOWN`,
                text: JSON.stringify(errors),
                html: `<span>Bot has had ${errors.length} errors and decided to shut down.</span><br><br><br><span style='font-family: Monospace,serif'>${JSON.stringify(errors)}</span>`
            }).then(cb).catch(rj);
        });
    }

    /**
     * Sends an error to the owner and also how many errors are being tracked.
     * @param {Error} error
     * @param {number} [errorCount=0] errorCount
     * @return {Promise<null>}
     */
    sendError(error, errorCount = 0){
        return new Promise((cb, rj) => {
            if(this.exit){
                log(6, "Cannot send error email due to emailHandler disabled.");
                cb();
            }
            return this.transporter.sendMail({
                from: `"Dreamland-BOT" <${this.sender}>`,
                to: this.receiver,
                subject: `[BOT] has had a [ERROR${errorCount !== 0 ? "#" + errorCount : ""}]`,
                text: error,
                html: `<span style='font-family: Monospace,serif'>${error.message}</span><br><br><br><span style="font-family: Monospace,serif">${error}</span>`
            }).then(cb).catch(rj);
        });
    }

    /**
     * Sends a notification email to owner that an admin needs something.
     * @param {User} user
     * @param {string} message
     * @return {Promise<null>}
     */
    sendNotification(user, message){
        return new Promise((cb, rj) => {
            if(this.exit){
                log(6, "Cannot send notification email due to emailHandler disabled.");
                cb();
            }
            return this.transporter.sendMail({
                from: `"Dreamland-BOT" <${this.sender}>`,
                to: this.receiver,
                subject: `[BOT] ${user.tag} notification.`,
                text: message
            }).then(cb).catch(rj);
        });
    }

    get transporter(){
        return this._transporter;
    }
}

module.exports = emailHandler;
