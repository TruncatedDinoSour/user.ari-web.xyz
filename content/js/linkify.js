"use strict";

const LINKIFY_LINK =
    /((?:[a-z]+\+)?(?:https?|s?ftp|ssh|telnet|smtp|imap|pop3|ldap):\/\/[a-z0-9\-._~:/?#[\]@!$&'()*+,;%=]+)/i;
const LINKIFY_EMAIL =
    /([a-z0-9+_-]+(?:\.[a-z0-9+_-]+)*@[a-z0-9+_-]+(?:\.[a-z0-9+_-]+)*)/i;
const LINKIFY_HASH = /^#\d+$/;
const LINKIFY_ORIGINS = ["127.0.0.1", "user.ari-web.xyz"];

function linkify(input) {
    let output = [];

    input.split(/(\s+)/).forEach((word) => {
        let a;

        if (word.match(LINKIFY_HASH)) {
            a = document.createElement("a");
            a.innerText = word;
            a.href = `${
                LINKIFY_ORIGINS.includes(window.location.host)
                    ? ""
                    : "https://user.ari-web.xyz/"
            }#${word}`;
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
