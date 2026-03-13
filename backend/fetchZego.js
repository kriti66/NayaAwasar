async function go() {
    const res = await fetch("https://api.github.com/search/code?q=generateToken04+repo:ZEGOCLOUD/zego_server_assistant", {
        headers: { "User-Agent": "Node-fetch" }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

go();
