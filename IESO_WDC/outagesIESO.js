(function() {
    // Create the connector object
    var myConnector = tableau.makeConnector();

    // Define the schema
    myConnector.getSchema = function(schemaCallback) {
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
    myConnector.getData = function(table, doneCallback) {
        
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
            x.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {

                    setTimeout(function () {

                        // document is ready:
                        xhttp = x.responseText;

                        parser = new DOMParser();
                        xmlDoc = parser.parseFromString(xhttp, "text/xml");

                        var temp = xmlDoc.getElementsByTagName("OutageRequest");

                        var i;

                        for (i = 0; i < temp.length; i++) {


                            var outage = {

                                outageID: temp[i].querySelector("OutageID").innerHTML,
                                plannedStart: temp[i].querySelector("PlannedStart").innerHTML,
                                plannedEnd: temp[i].querySelector("PlannedEnd").innerHTML,
                                priority: temp[i].querySelector("Priority").innerHTML,
                                recurrence: temp[i].querySelector("Recurrence").innerHTML,
                                recallTime: temp[i].querySelector("EquipmentRecallTime").innerHTML,
                                status: temp[i].querySelector("OutageRequestStatus").innerHTML,
                                equipmentname: null,
                                equipmenttype: null,
                                equipmentvoltage: null,
                                constrainttype: null
                            };

                            var equipment = temp[i].querySelectorAll("EquipmentRequested");

                            var j;

                            for (j = 0; j < equipment.length; j++) {

                                var obj = Object.assign({}, outage);
                                obj.equipmentname = equipment[j].children[0].innerHTML;
                                obj.equipmenttype = equipment[j].children[1].innerHTML;
                                obj.equipmentvoltage = equipment[j].children[2].innerHTML;
                                obj.constrainttype = equipment[j].children[3].innerHTML;
                                outages.push(obj);
                            };
                        };
                        outages = [... new Set(outages)];


                    }, 1000);

                }
            };
            x.open('GET', proxyurl + url[k]);
            x.send();

        };

        setTimeout(function () {

            table.appendRows(outages);
            doneCallback();

        }, 3000);

    };

    tableau.registerConnector(myConnector);

    // Create event listeners for when the user submits the form
    $(document).ready(function() {
        $("#submitButton").click(function() {
            tableau.connectionName = "IESO Transmission Outages"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();
