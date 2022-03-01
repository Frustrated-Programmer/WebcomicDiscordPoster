/**
 * The ErrorHandler is to ensure all errors are tracked,
 * and too many errors in a duration of time means something is up and to stop trying.
 * There is a greater delay up to an hour of waiting before attempts.
 * After 1 failure means 1 min delay, but a 2nd failure is 7.5 min delay, 5 fails is 27 min delay.
 */
class errorHandler{
    constructor(){
        log(5, "ErrorHandler: READY.");
        this.errors = [];
    }

    /**
     * Take care of handling an error.
     * @param {Error} error
     * @return {Promise<number>}
     */
    onError(error){
        return new Promise((cb) => {
            log(5, error);
            console.error(error)
            this.trackError(error);
            let minutes = this.errors.length + (this.errors.length - 1);
            if(this.errors.length <= 10){
                log(5, `Since an Error occurred, Bot will wait ${minutes} minute${minutes > 1 ? "s" : ""} before trying again.`);
                emailHandler.sendError(error, this.errors.length).then(function(){
                    cb(minutes);
                }).catch(function(e){
                    log(5, `couldn't Send ErrorEmail: ${e}`);
                    cb(minutes);
                });
            }
            else{
                this.shutoff();
            }
        });
    }

    /**
     * Track the error and update previous tracking.
     * @param {Error} error
     */
    trackError(error){
        let now = Date.now();
        this.errors.push({
            error: error.message,
            trace: error.stackTrace || error.stack,
            date: now,
            neaten: new Date(now).toString()
        });
        for(let i = 0; i < this.errors.length; i++){
            if(now - (60000 * 305) > this.errors[i].date){ //remove all errors more than an 5 hours old.
                this.errors.splice(i, 1);                  //The 5 hours is to give time for a longer delay between attempts
                i--;                                       //The errors are still logged, just no longer tracked.
            }
        }
    }

    /**
     * Shutdown the entire code.
     */
    shutoff(){
        //Too many errors have happened in a hour.
        log(5, `${this.errors.length} Errors have occurred in the same hour. Assumed something bad has happened`);
        emailHandler.sendShutoff(this.errors).then(() => { process.exit(0); }).catch((e) => {
            log(5, `Couldn't send shutdown email. ${e}`);
            process.exit(0);
        });
    }
}

module.exports = errorHandler;
