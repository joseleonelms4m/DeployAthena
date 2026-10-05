
const socket = new WebSocket(`ws://${location.hostname}:8080`);

socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ task: "init" }));
});

function renderHubs(hubsData, shake) {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = hubsData.map(h => {
        const perclosShake = (shake && shake.field === 'perclos' && shake.ip === h.ip) ? ' shake' : '';
        const vibrationShake = (shake && shake.field === 'vibration' && shake.ip === h.ip) ? ' shake' : '';
        return `
                <tr data-ip="${h.ip}">
                    <td><input type="checkbox" name="hub" value="${h.ip}"></td>
                    <td>${h.name}</td>
                    <td>${h.ip}</td>
                    <td><span class="badge" data-ip="${h.ip}">${h.statusBadge}</span></td>
                    <td class="last-attempt" data-ip="${h.ip}">${h.lastAttempt}</td>
                    <td class="update-badge" data-ip="${h.ip}">${h.updateBadge}</td>
                    <td class="perclos-badge${perclosShake}" data-ip="${h.ip}">${h.perclosBadge}</td>
                    <td class="vib-badge${vibrationShake}" data-ip="${h.ip}">${h.vibrationBadge}</td>
                </tr>`;
    }).join('');
}

socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'state') {
        renderHubs(msg.hubs, msg.shake);
        document.getElementById('loader')?.remove();
    }
});

document.querySelector('form.import-bar').addEventListener('click', async () => {
    const csvInput = document.querySelector('.csv-input');
    if (!csvInput.files.length) {
        alert("Por favor, selecciona un archivo CSV antes de importar.");
    }
    else{
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
            reader.onload = (e) => {
                const csvContent = e.target.result;
                const csvContentString = JSON.stringify(csvContent);
                socket.send(JSON.stringify({task: "import", hubs: csvContentString}))
                //socket.send(JSON.stringify({ task: "import", content: csvContent }));
                resolve();
            };
            reader.onerror = reject;
            reader.readAsText(csvInput.files[0]);
        });
    }
    //socket.send(JSON.stringify({ task: "import"}));
    //console.log("dcjndcjdncjdncjnd")
})

document.getElementById('deploy-btn').addEventListener('click', () => {
    const selectedIPs = [...document.querySelectorAll('input[name=hub]:checked')].map(cb => cb.value);
    socket.send(JSON.stringify({ task: "deploy", hubs: selectedIPs }));
});

document.getElementById('update-btn').addEventListener('click', () => {
    const selectedIPs = [...document.querySelectorAll('input[name=hub]:checked')].map(cb => cb.value);
    socket.send(JSON.stringify({ task: "update", hubs: selectedIPs }));
});

document.getElementById('perclos-off-btn').addEventListener('click', () => {
    const selectedIPs = [...document.querySelectorAll('input[name=hub]:checked')].map(cb => cb.value);
    socket.send(JSON.stringify({ task: "perclosOff", hubs: selectedIPs }));
});

document.getElementById('perclos-on-btn').addEventListener('click', () => {
    const selectedIPs = [...document.querySelectorAll('input[name=hub]:checked')].map(cb => cb.value);
    socket.send(JSON.stringify({ task: "perclosOn", hubs: selectedIPs }));
});

document.getElementById('vibration-off-btn').addEventListener('click', () => {
    const selectedIPs = [...document.querySelectorAll('input[name=hub]:checked')].map(cb => cb.value);
    socket.send(JSON.stringify({ task: "vibrationOff", hubs: selectedIPs }));
});

document.getElementById('vibration-on-btn').addEventListener('click', () => {
    const selectedIPs = [...document.querySelectorAll('input[name=hub]:checked')].map(cb => cb.value);
    socket.send(JSON.stringify({ task: "vibrationOn", hubs: selectedIPs }));
});