"use strict";

const COMMENTS_DEC = 20;
const HIGHLIGHT_CLASS = "highlight-comment";

async function api(endpoint, options) {
    // return await fetch(`http://127.0.0.1:5000/${endpoint}`, options);
    return await fetch(`https://server.ari-web.xyz/${endpoint}`, options);
}

function new_comment(cid, cauthor, ccontent, cadmin) {
    let li = document.createElement("li");
    let author = document.createElement("pre");
    let author_name = document.createElement("pre");

    if (cid) {
        let perm_id = document.createElement("a");
        perm_id.innerText = perm_id.href = `#${cid}`;
        li.id = cid;

        author.appendChild(perm_id);
    }

    author_name.innerText = cauthor;
    if (cadmin) author_name.className = "admin";

    author.appendChild(author_name);
    li.appendChild(author);

    let content = document.createElement("pre");

    for (let elem of linkify(ccontent)) content.appendChild(elem);

    li.appendChild(content);

    return li;
}

async function load_comments(comments, noscroll) {
    if (comments.comments < 1) return;

    let old_comments = comments.comments;
    comments.comments = Math.max(0, old_comments - COMMENTS_DEC + 1);

    let j = await (await api(`${comments.comments}/${old_comments}`)).json();
    let k;

    for (k of Object.keys(j).reverse())
        comments.appendChild(new_comment(k, ...j[k]));

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
        load_hash(true);
    };

    comments.appendChild(li);

    if (!noscroll) window.scrollTo(0, document.body.scrollHeight);

    comments.comments--;
}

function load_comment_field(comments) {
    let comment = document.getElementById("comment");
    let send = document.getElementById("send-comment");

    send.onclick = async () => {
        if (!(comment.value = comment.value.trim())) return;

        let data = new FormData();
        data.set("content", comment.value);

        let comment_id = await (
            await api("/", {
                method: "POST",
                body: data,
                headers: {
                    "api-key": window.localStorage.getItem("api-key") ?? "",
                },
            })
        ).text();

        comment.value = "";

        document.getElementById("count").innerText = comment_id;
        comments.comments = parseInt(comment_id);

        if (comments.comments - 1 > comments.old_comments) {
            let li = document.createElement("li");
            let i = document.createElement("i");

            i.innerText = `skipped ${
                comments.comments - comments.old_comments - 1
            } comment(s)`;

            li.setAttribute("data-skip", true);
            li.appendChild(i);

            comments.prepend(li);
        }

        comments.old_comments = comments.comments;

        comments.prepend(
            new_comment(comment_id, data.get("author"), data.get("content"))
        );
    };
}

function whoami() {
    api("whoami")
        .then((r) => (r.ok ? r.text() : null))
        .then((t) => {
            if (t)
                document.getElementById(
                    "comment"
                ).placeholder = `${t} says ...`;
        });
}

function infask(ask) {
    let val;
    while (!val) val = prompt(ask).trim();
    return val;
}

function whitelist() {
    let username = infask("username");
    let reason = infask("why do you want to join");

    let data = new FormData();

    data.set("content", reason);
    data.set("author", username);

    api("apply", {
        method: "POST",
        body: data,
    })
        .then((r) => r.text())
        .then((t) => alert(t));
}

function load_hash(noscroll) {
    let hash = window.location.hash.slice(1);
    window.highlight = hash ? document.getElementById(hash) : null;

    if (hash && window.highlight) {
        window.highlight.classList.add(HIGHLIGHT_CLASS);
        if (!noscroll) window.highlight.scrollIntoView();
    }

    addEventListener("hashchange", () => {
        window.highlight?.classList.remove(HIGHLIGHT_CLASS);

        let hash = window.location.hash.slice(1);
        window.highlight = document.getElementById(hash);

        if (hash && window.highlight) {
            window.highlight.classList.add(HIGHLIGHT_CLASS);
            if (!noscroll) window.highlight.scrollIntoView();
        }
    });
}

function load_settings() {
    /* load def values */

    try {
        let rules = document.getElementById("style").sheet.cssRules[0].style;
        let values = document.getElementById("values");

        Array.from(rules)
            .filter((v) => v.startsWith("--"))
            .forEach((v) => {
                let li = document.createElement("li");
                li.innerText = `${v} = ${rules.getPropertyValue(v)}`;
                values.appendChild(li);
            });
    } catch (e) {
        console.error(e);
    }

    let settings = document.getElementById("settings");

    if (!window.localStorage.getItem("tab"))
        window.localStorage.setItem("tab", "    ");

    /* load settings */

    function container(id, textarea, title, dostyle) {
        let wrap = document.createElement("div");
        let label_elm = document.createElement("label");

        textarea.spellcheck = false;
        textarea.value = window.localStorage.getItem(id);
        textarea.placeholder =
            textarea.title =
            label_elm.innerText =
            label_elm.title =
                title;

        label_elm.htmlFor = textarea.id = id;

        if (dostyle) style.innerText = textarea.value;

        wrap.appendChild(label_elm);
        wrap.appendChild(textarea);

        return wrap;
    }

    let style = document.createElement("style");

    let css_textarea = document.createElement("textarea");
    let tab_textarea = document.createElement("input");
    let api_textarea = document.createElement("input");

    css_textarea.oninput = () => {
        style.innerText = css_textarea.value;
        window.localStorage.setItem("css", css_textarea.value);
    };

    tab_textarea.oninput = () => {
        tab_textarea.value = tab_textarea.value.replaceAll("\\t", "\t");
        window.localStorage.setItem("tab", tab_textarea.value);
    };

    api_textarea.oninput = () => {
        window.localStorage.setItem("api-key", api_textarea.value);
    };

    settings.appendChild(
        container("css", css_textarea, "your custom css rules here", true)
    );

    settings.appendChild(
        container(
            "tab",
            tab_textarea,
            "tab character( s ) to use ( \\t for tab )"
        )
    );

    settings.appendChild(container("api-key", api_textarea, "api key"));

    document.head.appendChild(style);
}

function load_textarea_controls() {
    document.querySelectorAll("textarea,input").forEach((textarea) => {
        textarea.onkeydown = (e) => {
            if (e.key !== "Tab") return;

            let end = textarea.selectionEnd;
            let text = textarea.value;

            let tab = window.localStorage.getItem("tab");

            textarea.value =
                text.substring(0, textarea.selectionStart) +
                tab +
                text.substring(end);

            textarea.selectionEnd = end + tab.length;

            e.preventDefault();
        };
    });
}

function toggle_lock(t) {
    document.getElementById("unlock").innerText = t === "1" ? "un" : "";
    document.getElementById("comment").disabled = t === "1";
    document.getElementById("islocked").innerText =
        t === "1" ? "( locked )" : "";
}

function load_admin() {
    if (!window.localStorage.getItem("api-key")) return;

    document.getElementById("admin").style.display = "block";

    document.getElementById("lock-comments").onclick = () => {
        api("lock", {
            method: "POST",
            headers: { "api-key": window.localStorage.getItem("api-key") },
        })
            .then((r) => r.text())
            .then((t) => {
                toggle_lock(t);
            });
    };

    document.getElementById("run-sql").onclick = () => {
        let data = new FormData();
        let backup;

        data.set("sql", infask("sql"));
        if ((backup = prompt("backup").trim())) data.set("backup", backup);

        api("sql", {
            method: "POST",
            body: data,
            headers: { "api-key": window.localStorage.getItem("api-key") },
        })
            .then((r) => r.json())
            .then((t) => {
                console.log(t);
                alert(t);
            });
    };
}

async function main() {
    load_settings();
    load_admin();

    let comments = document.getElementById("comments");
    let count = document.getElementById("count");

    comments.old_comments = await (await api("total")).text();

    comments.comments = window.location.hash
        ? window.location.hash.slice(1)
        : comments.old_comments;

    count.innerText = comments.old_comments;

    api("lock")
        .then((r) => r.text())
        .then((t) => toggle_lock(t));

    load_comment_field(comments);
    load_textarea_controls();

    await load_comments(comments, true);
    load_hash();

    try {
        whoami();
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener("DOMContentLoaded", main);
