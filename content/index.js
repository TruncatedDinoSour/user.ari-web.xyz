"use strict";

const COMMENTS_DEC = 20;

async function api(endpoint, options) {
    // return await fetch(`http://127.0.0.1:5000/${endpoint}`, options);
    return await fetch(`https://server.ari-web.xyz/${endpoint}`, options);
}

function linkify(input) {
    let output = [];
    let words = input.split(/(\s+)/);

    let link =
        /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
    let email = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;

    words.forEach((word) => {
        let a = document.createElement("a");
        a.target = "_blank";

        if (word.match(link)) {
            a.href = word;
            a.innerText = word;
            output.push(a);
        } else if (word.match(email)) {
            a.href = `mailto:${word}`;
            a.innerText = word;
            output.push(a);
        } else output.push(document.createTextNode(word));
    });

    return output;
}

function new_comment(cid, cauthor, ccontent) {
    let li = document.createElement("li");
    let author = document.createElement("div");
    let author_name = document.createElement("span");

    if (cid) {
        let perm_id = document.createElement("a");
        perm_id.innerText = perm_id.href = `#${cid}`;
        author.appendChild(perm_id);
    }

    author_name.innerText = cauthor;
    author.appendChild(author_name);
    li.appendChild(author);

    let content = document.createElement("div");

    for (let elem of linkify(ccontent)) content.appendChild(elem);

    li.appendChild(content);

    return li;
}

async function load_comments(comments, noscroll) {
    if (comments.comments < 1) return;

    let old_comments = comments.comments;
    comments.comments = Math.max(0, old_comments - COMMENTS_DEC + 1);

    api(`${comments.comments}/${old_comments}`)
        .then((r) => r.json())
        .then((j) => {
            let k;

            for (k of Object.keys(j).reverse()) {
                let c = j[k];
                comments.appendChild(new_comment(k, c[0], c[1]));
            }

            if (!noscroll) window.scrollTo(0, document.body.scrollHeight);
            if (!k || k === "1") return;

            let li = document.createElement("li");
            let button = document.createElement("button");

            button.innerText = "press to load more ...";

            li.setAttribute("data-readmore", true);
            li.appendChild(button);

            li.onclick = async () => {
                li.remove();
                await load_comments(comments);
            };

            comments.appendChild(li);
        })
        .catch((e) => {
            throw e;
        });
    comments.comments--;
}
async function load_comment_field(comments, old_comments_count) {
    let comment = document.getElementById("comment");
    let send = document.getElementById("send-comment");

    send.onclick = async () => {
        if (!comment.value) return;

        let data = new FormData();

        data.set("author", window.localStorage["username"]);
        data.set("content", comment.value);

        api("/", {
            method: "POST",
            body: data,
        })
            .then((r) => r.text())
            .then((d) => {
                comment.value = "";

                document.getElementById("count").innerText = d;
                comments.comments = parseInt(d);

                if (
                    !comments.skipped &&
                    comments.comments - 1 > old_comments_count
                ) {
                    comments.skipped = true;

                    let li = document.createElement("li");
                    let i = document.createElement("i");

                    i.innerText = `skipped ${
                        comments.comments - old_comments_count - 1
                    } comment( s )`;

                    li.setAttribute("data-skip", true);
                    li.appendChild(i);

                    comments.prepend(li);
                }
                comments.prepend(
                    new_comment(d, data.get("author"), data.get("content"))
                );
            })
            .catch(() => window.location.reload());
    };
}

async function handle_auth() {
    let username = window.localStorage.getItem("username");
    while (!username) username = prompt("username");
    window.localStorage.setItem("username", username);
}

async function main() {
    await handle_auth();

    let comments = document.getElementById("comments");
    let comment_count = await (await api("total")).text();

    comments.comments = window.location.hash
        ? window.location.hash.slice(1)
        : comment_count;
    document.getElementById("count").innerText = comment_count;

    await load_comment_field(comments, comments.comments);
    await load_comments(comments, comment_count, true);
}

document.addEventListener("DOMContentLoaded", main);
