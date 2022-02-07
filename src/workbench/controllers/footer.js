'use strict';

/**
 * Provides controller constructor for footer view.
 *
 * @constructor
 * @param {Object} scope - injected scope object
 * @param {function} http - angular http provider
 * @param {ViewFrameFactory} viewFrame - custom view frame factory
 * @param {ToastFactory} toast - custom toast message service
 * @param {LoggerFactory} logger - custom logger factory
 */
export default function FooterController(scope, http, viewFrame, toast, logger) {
    const {document} = window;
    const footerMain = document.getElementById('mainFooter');

    scope.eventLogs = logger.getCache();

    scope.toggleActivityLog = function (event) {
        const {target} = event;

        if (target.checked === true) {
            logger.resume();

            footerMain.classList.add('maximized');
            document.getElementById('index__ngView').classList.add('resized');
        } else {
            logger.pause();
            logger.clear();

            footerMain.classList.remove('maximized');
            document.getElementById('index__ngView').classList.remove('resized');
        }
    };

    /* TODO : CHECK FOR UPDATE EVENT SHOULD BE TRIGGERED FROM MAIN PROCESS USING IPC... Show message on footer */
}
