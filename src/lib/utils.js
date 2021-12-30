'use strict';

export default {
    explode(input = '', separator = ',') {
        const items = input.split(separator);
        return items.reduce((exploded, current) => {
            current = current.trim();

            if (current.length > 0) {
                exploded.push(current);
            }

            return exploded;
        }, []);
    },

    objectName(input) {
        if (typeof input !== 'string' || input.length === 0) {
            return 'None';
        }

        let position = input.length;

        while (position >= 0) {
            if (input.charAt(position) === '-') {
                break;
            }

            position--;
        }

        if (position === 0 || position === input.length) {
            return input;
        }

        return input.substr(position + 1).toUpperCase();
    }
};
