const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8081 });

wss.on("connection", ws => {
    console.log("New Client Connected!");


    ws.on("close", () => {
        console.log("Client has disconnected.");
    });

    ws.on("message", msg => {
        console.log(JSON.parse(msg.toString("utf8")));
        var id = JSON.parse(msg.toString("utf8"))[1];
        var action = JSON.parse(msg.toString("utf8"))[2]
        switch (action) {
            case "Authorize":
                var AUTH = JSON.stringify([
                    3, id, "Authorize",
                    {
                        idTagInfo: {
                            expiryDate: new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString(), // The date which idTag should be remved from the Authorization Cache
                            parentIdTag: 5, // Parent-Identifier
                            status: 'Accepted' // idTag is accepted
                        }
                    },
                ])
                ws.send(AUTH)
                break;
            case "BootNotification":
                var BN = JSON.stringify([ 
                    3,
                    id,
                    "BootNotification",
                    {
                        currentTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString(),
                        interval: 1000,
                        status: "Accepted"
                    },
                ]);
                ws.send(BN)
                break;
            case "DataTransfer":
                var DT = JSON.stringify([
                    3,
                    id,
                    "DataTransfer",
                    {
                        status: "Accepted",
                        data: "",
                    },
                ]);
                ws.send(DT);
                break;
            case "Heartbeat":
                var HB = JSON.stringify([3, id, "Heartbeat", {
                    currentTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString(),
                }]);
                ws.send(HB);
                break;

        }
    });

});

