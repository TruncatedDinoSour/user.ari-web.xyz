"use strict";

const LINKIFY_LINK =
    /((?:[a-z]+\+)?(?:https?|s?ftp|ssh|telnet|smtp|imap|pop3|ldap):\/\/[a-z0-9\-._~:/?#[\]@!$&'*+,;%=]+)/i;
const LINKIFY_EMAIL =
    /([a-z0-9+_-]+(?:\.[a-z0-9+_-]+)*@[a-z0-9+_-]+(?:\.[a-z0-9+_-]+)*)/i;
const LINKIFY_HASH = /^#\d+$/;

function linkify(input, comment_origin, origin_target) {
    let output = [];

    input.split(/(\s+)/).forEach((word) => {
        let a;

        if (word.match(LINKIFY_HASH)) {
            a = document.createElement("a");

            a.innerText = word;
            a.href = comment_origin ? `${comment_origin}/${word}` : word;
            if (origin_target) a.target = origin_target;

            output.push(a);
        } else
            word.split(LINKIFY_LINK).forEach((word) => {
                if (word.match(LINKIFY_LINK)) {
                    a = document.createElement("a");
                    a.target = "_blank";
                    a.href = a.innerText = word;

                    output.push(a);
                } else {
                    word.split(LINKIFY_EMAIL).forEach((word) => {
                        if (word.match(LINKIFY_EMAIL)) {
                            a = document.createElement("a");
                            a.target = "_blank";
                            a.href = `mailto:${word}`;

                            a.innerText = word;
                            output.push(a);
                        } else {
                            let last = output[output.length - 1];

                            if (last instanceof Text) last.textContent += word;
                            else output.push(document.createTextNode(word));
                        }
                    });
                }
            });
    });

    return output;
}
