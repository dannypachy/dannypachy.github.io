(function () {
    // Create the connector object
    var myConnector = tableau.makeConnector();

    // Init function for connector, called during every phase
    myConnector.init = function (initCallback) {
        tableau.authType = tableau.authTypeEnum.none;
        initCallback();
    }

    // Define the schema
    myConnector.getSchema = function (schemaCallback) {
        var cols = [{
            id: "outageID",
            alias: "Outage ID",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "plannedStart",
            alias: "Planned Start",
            dataType: tableau.dataTypeEnum.datetime
        }, {
            id: "plannedEnd",
            alias: "Planned End",
            dataType: tableau.dataTypeEnum.datetime
        }, {
            id: "priority",
            alias: "Priority",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "recurrence",
            alias: "Recurrence",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "recallTime",
            alias: "Recall Time",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "status",
            alias: "Status",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "equipmentname",
            alias: "Equipment Name",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "equipmenttype",
            alias: "Equipment Type",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "equipmentvoltage",
            alias: "Equipment Voltage",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "constrainttype",
            alias: "Equipment Constraint",
            dataType: tableau.dataTypeEnum.string
        }];

        var tableSchema = {
            id: "outages",
            alias: "All IESO Transmission Outages",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };

    // Download the data
    myConnector.getData = function (table, doneCallback) {

        var outages = new Array();
        var xhttp = null;

        const proxyurl = "https://cors-anywhere.herokuapp.com/";
        const url = ["http://reports.ieso.ca/public/TxOutagesTodayAll/PUB_TxOutagesTodayAll.xml",
            "http://reports.ieso.ca/public/TxOutages1to30DaysPlanned/PUB_TxOutages1to30DaysPlanned.xml",
            "http://reports.ieso.ca/public/TxOutages31to90DaysPlanned/PUB_TxOutages31to90DaysPlanned.xml",
            "http://reports.ieso.ca/public/TxOutages91to180DaysPlanned/PUB_TxOutages91to180DaysPlanned.xml",
            "http://reports.ieso.ca/public/TxOutages181to730DaysPlanned/PUB_TxOutages181to730DaysPlanned.xml"]; // site that doesn’t send Access-Control-*

        for (var k = 0; k < url.length; k++) {


            var x = new XMLHttpRequest();
            x.onloadend = function () {
                if (this.readyState == 4 && this.status == 200) {

                    // document is ready:
                    xhttp = x.responseText;

                    parser = new DOMParser();
                    xmlDoc = parser.parseFromString(xhttp, "text/xml");

                    var temp = xmlDoc.getElementsByTagName("OutageRequest");

                    var i;

                    for (i = 0; i < temp.length; i++) {


                        var outage = {

                            outageID: $(temp[i]).children("OutageID")[0].textContent,
                            plannedStart: $(temp[i]).children("PlannedStart")[0].textContent,
                            plannedEnd: $(temp[i]).children("PlannedEnd")[0].textContent,
                            priority: $(temp[i]).children("Priority")[0].textContent,
                            recurrence: $(temp[i]).children("Recurrence")[0].textContent,
                            recallTime: $(temp[i]).children("EquipmentRecallTime")[0].textContent,
                            status: $(temp[i]).children("OutageRequestStatus")[0].textContent,
                            equipmentname: null,
                            equipmenttype: null,
                            equipmentvoltage: null,
                            constrainttype: null
                        };

                        var equipment = $(temp[i]).children("EquipmentRequested");

                        var j;

                        for (j = 0; j < equipment.length; j++) {

                            var obj = $.extend({}, outage);
                            obj.equipmentname = $(equipment[j]).children("equipmentname").textContent;
                            obj.equipmenttype = $(equipment[j]).children("equipmenttype").textContent;
                            obj.equipmentvoltage = $(equipment[j]).children("equipmentvoltage").textContent;
                            obj.constrainttype = $(equipment[j]).children("constrainttype").textContent;
                            outages.push(obj);
                        };
                    };
                    //outages = [... new Set(outages)];
                };

            };

            x.open('GET', proxyurl + url[k], false);
            x.send();

        };

        table.appendRows(outages);
        doneCallback();
    };

    tableau.registerConnector(myConnector);

    // Create event listeners for when the user submits the form
    $(document).ready(function () {
        $("#submitButton").click(function () {
            tableau.connectionName = "IESO Transmisson Outage Reports"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();
