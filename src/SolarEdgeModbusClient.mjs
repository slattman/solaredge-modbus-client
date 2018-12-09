/*!
 * solaredge-modbus-client
 * Copyright(c) 2018 Brad Slattman slattman@gmail.com
 * GPL-3.0 Licensed
 */

import Net from 'net'
import Modbus from 'modbus-tcp'

export class SolarEdgeModbusClient {

    constructor(config) {

        this.config = config || {}
        this.config.port = this.config.port || 502
        this.config.host = this.config.host || "192.168.0.20"

        this.config.meters = this.config.meters || 0

        this.offset = 40001
        // https://www.solaredge.com/sites/default/files/sunspec-implementation-technical-note.pdf
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
            // [40110, 2, "I_Event_1", "uint32", "Not implemented"],
            // [40112, 2, "I_Event_2", "uint32", "Not implemented"],
            [40114, 2, "I_Event_1_Vendor", "uint32(bitmask)", "Vendor defined events: 0x1 – Off-grid (Available from inverter CPU firmware version 3.19xx and above) 4*"],
            // [40116, 2, "I_Event_2_Vendor", "uint32", "Not implemented"],
            // [40118, 2, "I_Event_3_Vendor", "uint32", "Not implemented"],
            [40120, 2, "I_Event_4_Vendor", "uint32", "3x2 in the inverter manual(LCD display) is translated to 0x03000002 in the I_Event_4_Vendor register (Available from inverter CPU firmware version 3.19xx and above) 4*"]
        ]

        let metermaker = (offset) => [
            [offset + 121, 1, "C_SunSpec_DID", "uint16", "Value = 0x0001. Uniquely identifies this as a SunSpec Common Model Block"],
            [offset + 122, 1, "C_SunSpec_Length", "uint16", "65 = Length of block in 16-bit registers"],
            [offset + 123, 16, "C_Manufacturer", "String(32)", "Meter manufacturer"],
            [offset + 139, 16, "C_Model", "String(32)", "Meter model"],
            [offset + 155, 8, "C_Option", "String(16)", "Export + Import, Production, consumption"],
            [offset + 163, 8, "C_Version", "String(16)", "Meter version"],
            [offset + 171, 16, "C_SerialNumber", "String(32)", "Meter SN"],
            [offset + 187, 1, "C_DeviceAddress", "uint16", "Inverter Modbus ID"],
            [offset + 188, 1, "C_SunSpec_DID", "uint16", "Well - known value.Uniquely identifies this as a SunSpecMODBUS Map: Single Phase(AN or AB) Meter(201), Split Single Phase(ABN) Meter(202), Wye - Connect Three Phase(ABCN) Meter(203), Delta - Connect Three Phase(ABC) Meter(204)"],
            [offset + 189, 1, "C_SunSpec_Length", "uint16", "Registers Length of meter model block"],
            [offset + 190, 1, "M_AC_Current", "int16", "Amps AC Current(sum of active phases)"],
            [offset + 191, 1, "M_AC_Current_A", "int16", "Amps Phase A AC Current"],
            [offset + 192, 1, "M_AC_Current_B", "int16", "Amps Phase B AC Current"],
            [offset + 193, 1, "M_AC_Current_C", "int16", "Amps Phase C AC Current"],
            [offset + 194, 1, "M_AC_Current_S F", "int16", "SF AC Current Scale Factor"],
            [offset + 195, 1, "M_AC_Voltage_L N", "int16", "Volts Line to Neutral AC Voltage(average of active phases)"],
            [offset + 196, 1, "M_AC_Voltage_A N", "int16", "Volts Phase A to Neutral AC Voltage"],
            [offset + 197, 1, "M_AC_Voltage_B N", "int16", "Volts Phase B to Neutral AC Voltage"],
            [offset + 198, 1, "M_AC_Voltage_C N", "int16", "Volts Phase C to Neutral AC Voltage"],
            [offset + 199, 1, "M_AC_Voltage_L L", "int16", "Volts Line to Line AC Voltage(average of active phases)"],
            [offset + 200, 1, "M_AC_Voltage_A B", "int16", "Volts Phase A to Phase B AC Voltage"],
            [offset + 201, 1, "M_AC_Voltage_B C", "int16", "Volts Phase B to Phase C AC Voltage"],
            [offset + 202, 1, "M_AC_Voltage_C A", "int16", "Volts Phase C to Phase A AC Voltage"],
            [offset + 203, 1, "M_AC_Voltage_S F", "int16", "SF AC Voltage Scale Factor"],
            [offset + 204, 1, "M_AC_Freq", "int16", "Herts AC Frequency"],
            [offset + 205, 1, "M_AC_Freq_SF", "int16", "SF AC Frequency Scale Factor"],
            [offset + 206, 1, "M_AC_Power", "int16", "Watts Total Real Power(sum of active phases)"],
            [offset + 207, 1, "M_AC_Power_A", "int16", "Watts Phase A AC Real Power"],
            [offset + 208, 1, "M_AC_Power_B", "int16", "Watts Phase B AC Real Power"],
            [offset + 209, 1, "M_AC_Power_C", "int16", "Watts Phase C AC Real Power"],
            [offset + 210, 1, "M_AC_Power_SF", "int16", "SF AC Real Power Scale Factor"],
            [offset + 211, 1, "M_AC_VA", "int16", "Volt - Amps Total AC Apparent Power(sum of active phases)"],
            [offset + 212, 1, "M_AC_VA_A", "int16", "Volt - Amps Phase A AC Apparent Power"],
            [offset + 213, 1, "M_AC_VA_B", "int16", "Volt - Amps Phase B AC Apparent Power"],
            [offset + 214, 1, "M_AC_VA_C", "int16", "Volt - Amps Phase C AC Apparent Power"],
            [offset + 215, 1, "M_AC_VA_SF", "int16", "SF AC Apparent Power Scale Factor"],
            [offset + 216, 1, "M_AC_VAR", "int16", " VAR Total AC Reactive Power(sum of active phases)"],
            [offset + 217, 1, "M_AC_VAR_A", "int16", " VAR Phase A AC Reactive Power"],
            [offset + 218, 1, "M_AC_VAR_B", "int16", "VAR Phase B AC Reactive Power"],
            [offset + 219, 1, "M_AC_VAR_C", "int16", "VAR Phase C AC Reactive Power"],
            [offset + 220, 1, "M_AC_VAR_SF", "int16", "SF AC Reactive Power Scale Factor"],
            [offset + 221, 1, "M_AC_PF", "int16", " % Average Power Factor(average of active phases)"],
            [offset + 222, 1, "M_AC_PF_A", "int16", "% Phase A Power Factor"],
            [offset + 223, 1, "M_AC_PF_B", "int16", " % Phase B Power Factor"],
            [offset + 224, 1, "M_AC_PF_C", "int16", " % Phase C Power Factor"],
            [offset + 225, 1, "M_AC_PF_SF", "int16", "SF AC Power Factor Scale Factor"],
            [offset + 226, 2, "M_Exported", "uint32", "Watt - hours Total Exported Real Energy"],
            [offset + 228, 2, "M_Exported_A", "uint32", "Watt - hours Phase A Exported Real Energy"],
            [offset + 230, 2, "M_Exported_B", "uint32", "Watt - hours Phase B Exported Real Energy"],
            [offset + 232, 2, "M_Exported_C", "uint32", "Watt - hours Phase C Exported Real Energy"],
            [offset + 234, 2, "M_Imported", "uint32", "Watt - hours Total Imported Real Energy"],
            [offset + 236, 2, "M_Imported_A", "uint32", "Watt - hours Phase A Imported Real Energy"],
            [offset + 238, 2, "M_Imported_B", "uint32", "Watt - hours Phase B Imported Real Energy"],
            [offset + 240, 2, "M_Imported_C", "uint32", "Watt - hours Phase C Imported Real Energy"],
            [offset + 242, 1, "M_Energy_W_SF", "int16", "SF Real Energy Scale Factor"],
            [offset + 243, 2, "M_Exported_VA", "uint32", "VA - hours Total Exported Apparent Energy"],
            [offset + 245, 2, "M_Exported_VA_A", "uint32", "VA - hours Phase A Exported Apparent Energy"],
            [offset + 247, 2, "M_Exported_VA_B", "uint32", "VA - hours Phase B Exported Apparent Energy"],
            [offset + 249, 2, "M_Exported_VA_C", "uint32", "VA - hours Phase C Exported Apparent Energy"],
            [offset + 251, 2, "M_Imported_VA", "uint32", "VA - hours Total Imported Apparent Energy"],
            [offset + 253, 2, "M_Imported_VA_A", "uint32", "VA - hours Phase A Imported Apparent Energy"],
            [offset + 255, 2, "M_Imported_VA_B", "uint32", "VA - hours Phase B Imported Apparent Energy"],
            [offset + 257, 2, "M_Imported_VA_C", "uint32", "VA - hours Phase C Imported Apparent Energy"],
            [offset + 259, 1, "M_Energy_VA_S F", "int16", "SF Apparent Energy Scale Factor"],
            [offset + 260, 2, "M_Import_VARh_Q1", "uint32", "VAR - hours Quadrant 1: Total Imported Reactive Energy"],
            [offset + 262, 2, "M_Import_VARh_Q1A", "uint32", "VAR - hours Phase A - Quadrant 1: Imported Reactive Energy"],
            [offset + 264, 2, "M_Import_VARh_Q1B", "uint32", "VAR - hours Phase B - Quadrant 1: Imported Reactive Energy"],
            [offset + 266, 2, "M_Import_VARh_Q1C", "uint32", "VAR - hours Phase C - Quadrant 1: Imported Reactive Energy"],
            [offset + 268, 2, "M_Import_VARh_Q2", "uint32", "VAR - hours Quadrant 2: Total Imported Reactive Energy"],
            [offset + 270, 2, "M_Import_VARh_Q2A", "uint32", "VAR - hours Phase A - Quadrant 2: Imported Reactive"],
            [offset + 272, 2, "M_Import_VARh_Q2B", "uint32", "VAR - hours Phase B - Quadrant 2: Imported Reactive Energy"],
            [offset + 274, 2, "M_Import_VARh_Q2C", "uint32", "VAR - hours Phase C - Quadrant 2: Imported Reactive Energy"],
            [offset + 276, 2, "M_Export_VARh_Q3", "uint32", "VAR - hours Quadrant 3: Total Exported Reactive Energy"],
            [offset + 278, 2, "M_Export_VARh_Q3A", "uint32", "VAR - hours Phase A - Quadrant 3: Exported Reactive Energy"],
            [offset + 280, 2, "M_Export_VARh_Q3B", "uint32", "VAR - hours Phase B - Quadrant 3: Exported Reactive Energy"],
            [offset + 282, 2, "M_Export_VARh_Q3C", "uint32", "VAR - hours Phase C - Quadrant 3: Exported Reactive Energy"],
            [offset + 284, 2, "M_Export_VARh_Q4", "uint32", "VAR - hours Quadrant 4: Total Exported Reactive Energy"],
            [offset + 286, 2, "M_Export_VARh_Q4A", "uint32", "VAR - hours Phase A - Quadrant 4: Exported Reactive Energy"],
            [offset + 288, 2, "M_Export_VARh_Q4B", "uint32", "VAR - hours Phase B - Quadrant 4: Exported Reactive Energy"],
            [offset + 290, 2, "M_Export_VARh_Q4C", "uint32", "VAR - hours Phase C - Quadrant 4: Exported Reactive Energy"],
            [offset + 292, 1, "M_Energy_VAR_SF", "int16", "SF Reactive Energy Scale Factor"],
            [offset + 293, 2, "M_Events", "uint32", "Flags See M_EVENT_ flags. 0 = nts."],
        ]
        if (this.config.meters >= 1)
            this.registers.push.apply(this.registers, metermaker(40000))
        if (this.config.meters >= 2)
            this.registers.push.apply(this.registers, metermaker(40174))
        if (this.config.meters >= 3)
            this.registers.push.apply(this.registers, metermaker(40348))

        this.socket = Net.connect(this.config)
        this.modbusClient = new Modbus.Client()

        this.modbusClient.writer().pipe(this.socket)
        this.socket.pipe(this.modbusClient.reader())

    }

    getData() {

        let promises = []

        this.registers.map(reg => {

            let start = 0
            let end = 0
            let data = []

            start = reg[0] - this.offset
            end = (start + reg[1]) - 1

            promises.push(new Promise((resolve, reject) => {

                this.modbusClient.readHoldingRegisters(1, start, end, (error, buffers) => {

                    if (error) {

                        reject(error)

                    } else {

                        let value = null
                        let buffer = Buffer.concat(buffers)

                        switch(reg[3]) {
                            case "String(16)":
                            case "String(32)":
                                value = buffer.toString()
                                break
                            case "uint16":
                                value = buffer.readUInt16BE().toString()
                                break
                            case "uint32":
                            case "acc32":
                                value = buffer.readUInt32BE().toString()
                                break
                            case "int16":
                                value = buffer.readInt16BE().toString()
                                break
                            case "int32":
                                value = buffer.readInt32BE().toString()
                                break
                        }

                        resolve({
                            id: reg[0],
                            size: reg[1],
                            name: reg[2],
                            type: reg[3],
                            description: reg[4],
                            buffers: buffers,
                            value: value
                        })

                    }

                })

            }))

        })

        return Promise.all(promises)

    }

}
