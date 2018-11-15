/*!
 * solaredge-modbus-client
 * Copyright(c) 2018 Brad Slattman slattman@gmail.com
 * GPL-3.0 Licensed
 */

import * as Net from 'net'
import * as Modbus from 'modbus-tcp'
import * as Mongo from 'mongodb'

export class SolarEdgeModbusClient {

    constructor() {

        this.offset = 40001;

        this.registers = [
            [40001, 2, "C_SunSpec_ID", "uint32", "Value = \"SunS\"(0x53756e53).Uniquely identifies this as a SunSpec MODBUS Map"],
            [40003, 1, "C_SunSpec_DID", "uint16", "Value = 0x0001.Uniquely identifies this as a SunSpec Common Model Block"],
            [40004, 1, "C_SunSpec_Length", "uint16", "65 = Length of block in 16 - bit registers"],
            [40005, 16, "C_Manufacturer", "String(32)", "Value Registered with SunSpec = \"SolarEdge \""],
            [40021, 16, "C_Model", "String(32)", "SolarEdge Specific Value"],
            [40045, 8, "C_Version", "String(16)", "SolarEdge Specific Value"],
            [40053, 16, "C_SerialNumber", "String(32)", "SolarEdge Unique Value"],
            [40069, 1, "C_DeviceAddress", "uint16", "MODBUS Unit ID"],
            [40070, 1, "C_SunSpec_DID", "uint16", "101 = single phase 102 = split phase1 103 = three phase"],
            [40071, 1, "C_SunSpec_Length", "uint16", "Registers 50 = Length of model block"],
            [40072, 1, "I_AC_Current", "uint16", "Amps AC Total Current value"],
            [40073, 1, "I_AC_CurrentA", "uint16", "Amps AC Phase A Current value"],
            [40074, 1, "I_AC_CurrentB", "uint16", "Amps AC Phase B Current value"],
            [40075, 1, "I_AC_CurrentC", "uint16", "Amps AC Phase C Current value"],
            [40076, 1, "I_AC_Current_SF", "int16", "AC Current scale factor"],
            [40077, 1, "I_AC_VoltageAB", "uint16", "Volts AC Voltage Phase AB value"],
            [40078, 1, "I_AC_VoltageBC", "uint16", "Volts AC Voltage Phase BC value"],
            [40079, 1, "I_AC_VoltageCA", "uint16", "Volts AC Voltage Phase CA value"],
            [40080, 1, "I_AC_VoltageAN", "uint16", "Volts AC Voltage Phase A to N value"],
            [40081, 1, "I_AC_VoltageBN", "uint16", "Volts AC Voltage Phase B to N value"],
            [40082, 1, "I_AC_VoltageCN", "uint16", "Volts AC Voltage Phase C to N value"],
            [40083, 1, "I_AC_Voltage_SF", "int16", "AC Voltage scale factor"],
            [40084, 1, "I_AC_Power", "int16", "Watts AC Power value"],
            [40085, 1, "I_AC_Power_SF", "int16", "AC Power scale factor"],
            [40086, 1, "I_AC_Frequency", "uint16", "Hertz AC Frequency value"],
            [40087, 1, "I_AC_Frequency_SF", "int16", "Scale factor"],
            [40088, 1, "I_AC_VA", "int16", "VA Apparent Power"],
            [40089, 1, "I_AC_VA_SF", "int16", "Scale factor"],
            [40090, 1, "I_AC_VAR", "int16", "VAR Reactive Power"],
            [40091, 1, "I_AC_VAR_SF", "int16", "Scale factor"],
            [40092, 1, "I_AC_PF", "int16", "% Power Factor4"],
            [40093, 1, "I_AC_PF_SF", "int16", "Scale factor"],
            [40094, 2, "I_AC_Energy_WH", "acc32", "WattHours AC Lifetime Energy production"],
            [40096, 1, "I_AC_Energy_WH_SF", "uint16", "Scale factor"],
            [40097, 1, "I_DC_Current", "uint16", "Amps DC Current value"],
            [40098, 1, "I_DC_Current_SF", "int16", "Scale factor"],
            [40099, 1, "I_DC_Voltage", "uint16", "Volts DC Voltage value"],
            [40100, 1, "I_DC_Voltage_SF", "int16", "Scale factor"],
            [40101, 1, "I_DC_Power", "int16", "Watts DC Power value"],
            [40102, 1, "I_DC_Power_SF", "int16", "Scale factor"],
            [40104, 1, "I_Temp_Sink", "int16", "Degrees C Heat Sink Temperature"],
            [40107, 1, "I_Temp_SF", "int16", "Scale factor"],
            [40108, 1, "I_Status", "uint16", "Operating State"],
            [40109, 1, "I_Status_Vendor", "uint16", "Vendor - defined operating state and error codes. The errors displayed here are similar to the ones displayed on the inverter LCD screen. For error description, meaning and troubleshooting, refer to the SolarEdge Installation Guide. 5*"],
            [40110, 2, "I_Event_1", "uint32", "Not implemented"],
            [40112, 2, "I_Event_2", "uint32", "Not implemented"],
            [40114, 2, "I_Event_1_Vendor", "uint32(bitmask)", "Vendor defined events: 0x1 – Off-grid (Available from inverter CPU firmware version 3.19xx and above) 4*"],
            [40116, 2, "I_Event_2_Vendor", "uint32", "Not implemented"],
            [40118, 2, "I_Event_3_Vendor", "uint32", "Not implemented"],
            [40120, 2, "I_Event_4_Vendor", "uint32", "3x2 in the inverter manual(LCD display) is translated to 0x03000002 in the I_Event_4_Vendor register (Available from inverter CPU firmware version 3.19xx and above) 4*"]
        ]
    
        this.config = {
            "net": {
                "host": "192.168.0.20",
                "port": "502"
            },
            "db": {
                "uri": "mongodb://0.0.0.0:27017/",
                "schema": "solardb"
            }
        }

    }

    getData() {

        try {

            console.log('connecting...')

            let self = this

            let socket = Net.connect(this.config.net, function () {

                let modbusClient= new Modbus.default.Client()    
                modbusClient.writer().pipe(socket)
                socket.pipe(modbusClient.reader())

                console.log('connection opened to ' + self.config.net.host + ' on port ' + self.config.net.port)
                console.log('reading modbus sunspec registers')

                let promises = []

                self.registers.map(reg => {

                    let start = 0
                    let end = 0
                    let data = []

                    start = reg[0] - self.offset
                    end = (start + reg[1]) - 1

                    promises.push(new Promise(function (resolve, reject) {

                        try {

                            modbusClient.readHoldingRegisters(1, start, end, function (error, buffers) {

                                if (error) {
                                    reject('error reading register', reg, error)
                                } else {

                                    let value = null
                                    const buffer = Buffer.concat(buffers)

                                    if (reg[3] == "String(16)" || reg[3] == "String(32)") {
                                        value = buffer.toString()
                                    }

                                    if (reg[3] == "uint16") {
                                        value = buffer.readUInt16BE().toString()
                                    }

                                    if (reg[3] == "uint32" || reg[3] == "acc32") {
                                        value = buffer.readUInt32BE().toString()
                                    }

                                    if (reg[3] == "int16") {
                                        value = buffer.readInt16BE().toString()
                                    }

                                    if (reg[3] == "int32") {
                                        value = buffer.readInt32BE().toString()
                                    }

                                    const result = {
                                        id: reg[0],
                                        size: reg[1],
                                        name: reg[2],
                                        type: reg[3],
                                        description: reg[4],
                                        buffers: buffers,
                                        value: value
                                    }

                                    resolve(result)

                                }

                            })

                        } catch (error) {

                            reject('error reading register', reg, error)

                        }

                    }))

                })

                const sock = this

                Promise.all(promises).then(function (data) {

                    const relaventData = [
                        'C_Manufacturer',
                        'C_Model',
                        'C_Version',
                        'C_SerialNumber',
                        'I_AC_Current',
                        'I_AC_VoltageAB',
                        'I_AC_Power',
                        'I_AC_Energy_WH',
                        'I_DC_Current',
                        'I_DC_Voltage',
                        'I_DC_Power',
                        'I_Temp_Sink'
                    ]

                    data.forEach(result => {

                        if (relaventData.indexOf(result.name) != -1) {

                            console.log(result.name + " - " + result.description + ": " + result.value)

                        }

                    })

                    // let mongoClient = new Mongo.default.MongoClient()
                    // mongoClient.connect(dburi, function (err, db) {
                    //     if (err) throw err;
                    //     var dbo = db.db("mydb");
                    //     var myobj = { name: "Company Inc", address: "Highway 37" };
                    //     dbo.collection("customers").insertOne(myobj, function (err, res) {
                    //         if (err) throw err;
                    //         console.log("1 document inserted");
                    //         db.close();
                    //     });
                    // });

                    sock.destroy();

                })

            })

            socket.on('close', function () {
                console.log("connection closed")
            })

            socket.on('data', function () {
                //console.log("data", arguments)
            })

            socket.on('drain', function () {
                console.log("drain", arguments)
            })

            socket.on('error', function () {
                console.log("error", arguments)
            })

            socket.on('end', function () {
                console.log("end", arguments)
            })

            socket.on('lookup', function () {
                console.log("lookup", arguments)
            })

            socket.on('timeout', function () {
                console.log("timeout", arguments)
            })

        } catch (e) {

            console.log(e)

        }

    }

}
