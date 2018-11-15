# solaredge-modbus-client
A simple modbus client reader for solaredge inverters.

## Example usage

```javascript
let SolarEdgeModbusClient = require('solaredge-modbus-client')

let solar = new SolarEdgeModbusClient({
    host: "192.168.0.20",
    port: 502
})

solar.getData().then((data) => {

    const RELAVENT_DATA = [
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

    let results = []

    data.map(result => {

        if (RELAVENT_DATA.indexOf(result.name) != -1) {

            console.log(result.name + " - " + result.description + ": " + result.value)

        }

    })

    solar.socket.destroy();

})
```

:metal: