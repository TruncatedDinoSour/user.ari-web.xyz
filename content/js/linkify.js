"use strict";

const LINKIFY_LINK =
    /((?:[a-z]+\+)?(?:https?|s?ftp|ssh|telnet|smtp|imap|pop3|ldap):\/\/[a-z0-9\-._~:/?#[\]@!$&'*+,;%=]+)/i;
const LINKIFY_EMAIL =
    /([.a-z0-9+_-]+(?:\.[.a-z0-9+_-]+)*@[a-z0-9+_-]+(?:\.[a-z0-9+_-]+)*)/i;
const LINKIFY_HASH = /^#\d+$/;
const LINKIFY_MENTION = /^@.+$/;

function mk_link(url, text, output) {
    let a = document.createElement("a");

    a.target = "_blank";
    a.href = url;
    a.innerText = text;

    output.push(a);
}

function linkify(input, comment_origin) {
    let output = [];

    input.split(/(\s+)/).forEach((word) => {
        if (word.match(LINKIFY_HASH))
            mk_link(
                comment_origin ? `${comment_origin}/${word}` : word,
                word,
                output
            );
        else if (word.match(LINKIFY_LINK)) mk_link(word, word, output);
        else if (word.match(LINKIFY_EMAIL))
            mk_link(`mailto:${word}`, word, output);
        else if (word.match(LINKIFY_MENTION)) {
            let b = document.createElement("b");
            b.innerText = word;
            output.push(b);
        } else {
            let last = output[output.length - 1];
            if (last instanceof Text) last.textContent += word;
            else output.push(document.createTextNode(word));
        }
    });

    return output;
}
