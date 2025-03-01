const getInitialZones = () => {

    let zones = {};
    Array.from({length: 25}, (_,index)=> zones[`zone${index}`] = {
        
        name: "Zone "+ index,
        description: "Zone "+ index,
        color: "gray",
        enabled: false,
        lastTriggered: null,
        triggered: false,
    })

    return zones;
}

const getInitialRealays = () => ({
    relay0: {
        name: "Relay 0",
        description: "Realay 0",
        state: false,
        lastTriggered: null
    },
    relay1: {
        name: "Relay 1",
        description: "Realay 1",
        state: false,
        lastTriggered: null
    },
})


module.exports = {getInitialZones, getInitialRealays};