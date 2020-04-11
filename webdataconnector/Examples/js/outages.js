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
            id: "duration",
            alias: "Duration",
            dataType: tableau.dataTypeEnum.float
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
        }, {
            id: "station",
            alias: "Station",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "timestamp",
            alias: "Date Retrieved",
            dataType: tableau.dataTypeEnum.datetime
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

        var d = new Date();
        var d_str = d.toISOString();

        const proxyurl = "https://cors-anywhere.herokuapp.com/";
        const url = ["http://reports.ieso.ca/public/TxOutagesTodayAll/PUB_TxOutagesTodayAll.xml",
            "http://reports.ieso.ca/public/TxOutages1to30DaysPlanned/PUB_TxOutages1to30DaysPlanned.xml",
            "http://reports.ieso.ca/public/TxOutages31to90DaysPlanned/PUB_TxOutages31to90DaysPlanned.xml",
            "http://reports.ieso.ca/public/TxOutages91to180DaysPlanned/PUB_TxOutages91to180DaysPlanned.xml",
            "http://reports.ieso.ca/public/TxOutages181to730DaysPlanned/PUB_TxOutages181to730DaysPlanned.xml"]; // site that doesn’t send Access-Control-*

        for (var k = 0; k < url.length; k++) {

            //XHR
            var x = new XMLHttpRequest();
            x.onloadend = function () {
                if (this.readyState == 4 && this.status == 200) {

                    // document is ready:
                    xhttp = x.responseText;

                    //Format to object
                    parser = new DOMParser();
                    xmlDoc = parser.parseFromString(xhttp, "text/xml");

                    var temp = xmlDoc.getElementsByTagName("OutageRequest");

                    var i;

                    for (i = 0; i < temp.length; i++) {

                        //Setup outage object
                        var outage = {

                            outageID: $(temp[i]).children("OutageID")[0].textContent,
                            plannedStart: $(temp[i]).children("PlannedStart")[0].textContent,
                            plannedEnd: $(temp[i]).children("PlannedEnd")[0].textContent,
                            duration: null,
                            priority: $(temp[i]).children("Priority")[0].textContent,
                            recurrence: $(temp[i]).children("Recurrence")[0].textContent,
                            recallTime: $(temp[i]).children("EquipmentRecallTime")[0].textContent,
                            status: $(temp[i]).children("OutageRequestStatus")[0].textContent,
                            equipmentname: null,
                            equipmenttype: null,
                            equipmentvoltage: null,
                            constrainttype: null,
                            station: null,
                            timestamp: null
                        };

                        //Set timestamp
                        outage.timestamp = d_str;

                        //Duration Calculation
                        var sd = new Date(outage.plannedStart);
                        var ed = new Date(outage.plannedEnd);
                        outage.duration = (ed - sd) / (24 * 3600 * 1000);

                        //Switch for Priority
                        switch (outage.priority) {
                            case "P":
                                outage.priority = "Planned";
                                break;
                            case "O":
                                outage.priority = "Opportunity";
                                break;
                            case "U":
                                outage.priority = "Urgent";
                                break;
                            case "F":
                                outage.priority = "Forced";
                                break;
                            case "FE":
                                outage.priority = "Forced Extended";
                                break;
                            case "I":
                                outage.priority = "Informational";
                                break;
                        }

                        //Switch for Recurrence
                        switch (outage.recurrence) {
                            case "C":
                                outage.recurrence = "Continuous";
                                break;
                            case "NC":
                                outage.recurrence = "Non-continuous";
                                break;
                            case "RE":
                                outage.recurrence = "Return Evenings";
                                break;
                            case "RSS":
                                outage.recurrence = "Return Sat – Sun";
                                break;
                            case "RSM":
                                outage.recurrence = "Return Sat – Mon";
                                break;
                            case "RFS":
                                outage.recurrence = "Return Fri – Sun";
                                break;
                            case "RFM":
                                outage.recurrence = "Return Fri – Mon";
                                break;
                            case "REW":
                                outage.recurrence = "Return Evenings and Weekends (Sat-Sun)";
                                break;
                        }

                        //Switch for Status
                        switch (outage.status) {
                            case "SUB":
                                outage.status = "Submitted";
                                break;
                            case "STDY":
                                outage.status = "Study";
                                break;
                            case "NEG":
                                outage.status = "Negotiate";
                                break;
                            case "AA":
                                outage.status = "Advance Approved";
                                break;
                            case "RISK":
                                outage.status = "At Risk";
                                break;
                            case "FA":
                                outage.status = "Final Approved";
                                break;
                            case "IMPL":
                                outage.status = "Implemented";
                                break;
                        }

                        //Get equipment
                        var equipment = $(temp[i]).children("EquipmentRequested");

                        var j;

                        //Define equipment parameters
                        for (j = 0; j < equipment.length; j++) {

                            var obj = $.extend({}, outage);
                            obj.equipmentname = $(equipment[j]).children("equipmentname")[0].textContent;
                            obj.equipmenttype = $(equipment[j]).children("equipmenttype")[0].textContent;
                            obj.equipmentvoltage = $(equipment[j]).children("equipmentvoltage")[0].textContent;
                            obj.constrainttype = $(equipment[j]).children("constrainttype")[0].textContent;

                            //Switch for Constraint
                            switch (obj.constrainttype) {
                                case "OOS":
                                    obj.constrainttype = "Out of Service";
                                    break;
                                case "IS":
                                    obj.constrainttype = "In Service";
                                    break;
                                case "DRATE":
                                    obj.constrainttype = "Derated To";
                                    break;
                                case "MUSTRUN":
                                    obj.constrainttype = "Must Run At";
                                    break;
                                case "HOLDOFF":
                                    obj.constrainttype = "Holdoff";
                                    break;
                                case "AVR/PSS OOS":
                                    obj.constrainttype = "Automatic Voltage Regulator/Power System Stabilizer Out of Service";
                                    break;
                                case "ASP OOS":
                                    obj.constrainttype = "Ancillary Service Out of Service";
                                    break;
                                case "PROT OOS":
                                    obj.constrainttype = "Protection Out of Service";
                                    break;
                                case "BF PROT OOS":
                                    obj.constrainttype = "Breaker Failure Protection Out of Service";
                                    break;
                                case "BTCT":
                                    obj.constrainttype = "Breaker Trip Coil Test";
                                    break;
                                case "INFO":
                                    obj.constrainttype = "Information";
                                    break;
                                case "ABNO":
                                    obj.constrainttype = "Available But Not Operating";
                                    break;
                            }

                            //RegEx for station
                            var re = /((ST. )*(\w+\s|\d+\s)+TS)|((ST. )*(\w+\s|\d+\s)+SS)|((ST. )*(\w+\s|\d+\s)+GS)/g;
                            var array1 = re.exec(obj.equipmentname);

                            //Assignment & special case for Manby TS
                            if (array1 == null) {
                                obj.station = null;
                            } else {
                                obj.station = array1[0];

                                if (obj.station == "MANBY EAST TS" || obj.station == "MANBY WEST TS") {

                                    obj.station = "MANBY TS";

                                };
                            };

                            //Push obj to outages array
                            outages.push(obj);
                        };
                    };
                    //Filter out duplicates
                    var result = outages.reduce(function (memo, e1) {
                        var matches = memo.filter(function (e2) {
                            return e1.outageID == e2.outageID && e1.equipmentname == e2.equipmentname
                        })
                        if (matches.length == 0)
                            memo.push(e1)
                        return memo;
                    }, [])

                    outages = result;
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
