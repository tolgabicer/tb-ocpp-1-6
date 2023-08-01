var c = 0;
var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; //Chars to create randomId
var id = randomId(); //Assigning randomId value
var _websocket = null;
var connector_locked = false;

function randomId() { // Function that creates randomId from values at possible variable
    id = "";
    for (var i = 0; i < 36; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return id;
}

function formatDate(date) { // Function that formats date
    return date.toISOString();
}
window.addEventListener("DOMContentLoaded", () => {
    getSettings();
    getData();
    $("#simulator-content").hide();
    $("#disconnect-btn").hide();
});


// Open the settings popup and overlay when the button is clicked
$('#settings-btn').on('click', function () {
    $('#settings-popup').show();
    $('#overlay').show();
});

// Close the settings popup and overlay when the close button is clicked
$('#close-btn').on('click', function () {
    $('#settings-popup').hide();
    $('#overlay').hide();
});

// Close the settings popup and overlay when clicking outside the popup
$('#overlay').on('click', function () {
    $('#settings-popup').hide();
    $('#overlay').hide();
});

$("#connect-btn").on("click", wsConnect);
$("#save-btn").on("click", changeSettings);
$("#disconnect-btn").on("click", wsConnect);

$("#authorize-btn").on("click", Authorize);
$("#heartbeat-btn").on("click", sendHeartBeat);
$("#start-transaction-btn").on("click", startTransaction);
$("#stop-transaction-btn").on("click", stopTransaction);
$("#send-meter-values-btn").on("click", meterValues);
$("#send-meter-values-loop-btn").on("click",meterValuesLoop);
$("#status-notification-btn").on("click", statusNotification);
$("#data-transfer-btn").on("click", dataTransfer);

function wsConnect() {
    if (_websocket) {
        _websocket.close(3001);
    }
    else {
        _websocket = new WebSocket(JSON.parse(localStorage.getItem("ocpp-settings"))["WebSocket URL"]);

        _websocket.onopen = () => {
            sendAlert("Connected successfully", "#4CAF50")
            changeIndicator("Client Connected To Central System","orange");
            $("#simulator-content").show();
            $("#main-content").hide();
            $("#disconnect-btn").show();
            BootNotification();
            sessionStorage.setItem("LastAction", "BootNotification");
        }

        _websocket.onmessage = (msg) => {
            c++;
            var ddata = msg.data;
            console.log(ddata)
            //Process Incoming Data

        }
        _websocket.onclose = (evt) => {
            if (evt.code == 3001) {
                $("#simulator-content").hide();
                $("#main-content").show();
                $("#disconnect-btn").hide();
                _websocket = null;
                sendAlert("Disconnected from server", "red");
            }
        };
        _websocket.onerror = () => {
            sendAlert("Error: Connection failed", "#FF0000")
            _websocket = null;
        }
    }
}

function Authorize() {
    //If an idTag presented by the user is not present in the Local Authorization List or Authorization Cache, then the Charge Point SHALL send an Authorize.req PDU to the Central System to request authorization.
    sessionStorage.setItem('LastAction', "Authorize");
    var Auth = JSON.stringify([
        2,
        id,
        "Authorize",
        { idTag: $("#tag").val() },
    ]);
    _websocket.send(Auth);
    sendAlert("Request Sent To Server", "orange");
}
function BootNotification() {
    var BN = JSON.stringify([ // Turn the object to a string
        2,
        id,
        "BootNotification",
        {
            chargePointModel: "AVT-Express",
            chargePointVendor: "AVT-Company",
            chargeBoxSerialNumber: "avt.001.13.1.01",
            chargePointSerialNumber: "avt.001.13.1",
            firmwareVersion: "0.9.87",
            iccid: "",
            imsi: "",
            meterSerialNumber: "avt.001.13.1.01",
            meterType: "AVT NQC-ACDC",
        },
    ]);

    _websocket.send(BN); // Send this info to the server
}
function dataTransfer() {
    sessionStorage.setItem("LastAction", "DataTransfer");
    var DT = JSON.stringify([
        2,
        id,
        "DataTransfer",
        {
            vendorId: "rus.avt.cp",
            messageId: "GetChargeInstruction",
            data: "",
        },
    ]);
    _websocket.send(DT);
    sendAlert("Data Transfer Successful", "orange");

}
function diagnosticStatusNotification() {
    var DSN = JSON.stringify([
        2,
        id,
        "DiagnosticStatusNotification",
        {
            status: "Idle",
        },
    ]);
    _websocket.send(DSN);
    sendAlert("Diagnostic Status Notification Sent", "orange");
}
function firmwareStatusnotification() {
    var FSN = JSON.stringify([
        2,
        id,
        "FirmwareStatusNotification",
        {
            status: "Idle",
        },
    ]);
    _websocket.send(FSN);
    sendAlert("Firmware Status Notification Sent", "orange");
}
function sendHeartBeat() {
    sessionStorage.setItem("LastAction", "Heartbeat");
    sendAlert("Heartbeat Sent", "orange");
    sessionStorage.setItem('LastAction', "Heartbeat");
    var HB = JSON.stringify([2, id, "Heartbeat", {}]);
    _websocket.send(HB);
}

function startHB(interval) {
    setInterval(sendHeartBeat, interval * 1000);
}
function meterValues(Alert = true) {
    sessionStorage.setItem("LastAction", "MeterValues");
    var MV = JSON.stringify([
        2,
        id,
        "MeterValues",
        {
            connectorId: Number($("#connectorUID").val()),
            transactionId: Number($("#transactionId").val()),
            meterValue: [
                {
                    timestamp: formatDate(new Date()),
                    sampledValue: [{ value: Number($("#meterValue").val()) }],
                },
            ],
        },
    ]);

    _websocket.send(MV); //Send meterValue to the server
    if(Alert){
        sendAlert("Meter Value Sent", "orange");
    }

}
function meterValuesLoop() {
    sendAlert("Meter Value Loop Started", "orange");

    var i = Number($("#timeInterval").val());
    var timesRun = 0;
    var interval = setInterval(function () {
        timesRun += 1;
        var val = Number($("#meterValue").val());
        var incrementvalue = Number($("#incrementValue").val());
        var counter = Number($("#counter").val());
        var Myelement = document.getElementById("meterValue").value;
        console.log("Meter Value:",Myelement);
        Myelement.value = (val + incrementvalue).toString();;
        console.log("mvp", val, incrementvalue, interval, counter);
        if (timesRun === counter) {
            timesRun = 0;
            clearInterval(interval);
        }
        //do whatever here..
        meterValues(false);
    }, i);
}
function startTransaction() {
    sessionStorage.setItem("LastAction", "startTransaction");
    connector_locked = true;
    sendAlert("Connector Status Changed To: " + connector_locked, "#4CAF50");
    changeIndicator("Transaction Started","green");
    var strtT = JSON.stringify([
        2,
        id,
        "StartTransaction",
        {
            connectorId: parseInt($("#connectorUID").val()),
            idTag: $("#Tag").val(),
            timestamp: formatDate(new Date()),
            meterStart: 0,
            reservationId: 0,
        },
    ]);
    _websocket.send(strtT);
}
function stopTransaction() {
    connector_locked = false;
    sendAlert("Connector Status Changed To: " + connector_locked, "red");
    changeIndicator("Transaction Stopped","red");

    var stpT = JSON.stringify([
        2,
        id,
        "StopTransaction",
        {
            transactionId: Number($("#transactionId").val()),
            idTag: $("#Tag").val(),
            timestamp: formatDate(new Date()),
            meterStop: $("#meterValue").val(),
        },
    ]);
    _websocket.send(stpT); //Send stopTransaction Data To Server
}
function statusNotification() {
    sessionStorage.setItem("LastAction", "StatusNotification");
    var SN = JSON.stringify([
        2,
        id,
        "StatusNotification",
        {
            connectorId: parseInt($("#CUID").val()),
            status: $("#ConnectorStatus").val(),
            errorCode: "NoError",
            info: "",
            timestamp: formatDate(new Date()),
            vendorId: "",
            vendorErrorCode: "",
        },
    ]);
    _websocket.send(SN);
    sendAlert("Status Notification Sent", "orange");

}
function getSettings() {
    if (localStorage.getItem("ocpp-settings") === null) {
        fetch("defaultSettings.JSON")
            .then(response => response.json())
            .then(data => localStorage.setItem("ocpp-settings", JSON.stringify(data)))
            .then(() => {
                setSettings();
            })
    }
    else {
        setSettings();
    }

}
function setSettings() {
    //Create Items
    const settingsInfo = JSON.parse(localStorage.getItem("ocpp-settings"));
    const settingsData = $("#settings-data")[0];
    for (const key in settingsInfo) {
        if (settingsInfo.hasOwnProperty(key)) {
            var element = `<label for="${key}">${key}</label>
            <input type="text" id="${key}" value="${settingsInfo[key]}" class="settings-input">`
            settingsData.innerHTML += element;
        }
    }
}
function changeSettings() {
    let newObject = {};
    for (const element of $(".settings-input")) {
        newObject[element.id] = element.value;
    }

    localStorage.setItem("ocpp-settings", JSON.stringify(newObject));

    $('#settings-popup').hide();
    $('#overlay').hide();
    sendAlert("Settings changed successfully", "#4CAF50")
}
function getData() {
    if (localStorage.getItem("simulator-settings") === null) {
        fetch("defaultData.JSON")
            .then(response => response.json())
            .then(data => localStorage.setItem("simulator-settings", JSON.stringify(data)))
            .then(() => {
                setData();
            })
    }
    else {
        setData();
    }

}
function setData() {
    const simulatorInfo = JSON.parse(localStorage.getItem("simulator-settings"));
    for (const key in simulatorInfo) {
        if (simulatorInfo.hasOwnProperty(key)) {
            document.getElementById(key).value = simulatorInfo[key]
        }
    }
}

function changeSettings() {
    let newObject = {};
    for (const element of $(".input-field")) {
        newObject[element.id] = element.value;
    }

    localStorage.setItem("simulator-settings", JSON.stringify(newObject));
}



function sendAlert(text, color) {
    $("#alertBox").text(text)
    $("#alertBox").css("background-color", color);
    $("#alertBox").addClass('alert-box-show ');
    setTimeout(() => {
        $("#alertBox").removeClass('alert-box-show ');
    }, 3000); // 3000ms = 3 seconds (adjust as needed)
}
function changeIndicator(text,status){
    var indicator = $("#status-indicator");
    indicator.text(text);
    indicator.removeAttr("class");
    indicator.attr("class","indicator");
    indicator.addClass(status);
}
