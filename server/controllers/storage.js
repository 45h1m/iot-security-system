const storage = require("node-persist");
const { getInitialZones, getInitialRealays } = require("../schemas/schemas");

storage.initSync();

let zones = [];
let logs = [];
let triggers = [];
let relays = [];

async function initStorage() {
    try {
        await storage.clear();

        zones = await storage.getItem("zones");
        logs = await storage.getItem("logs");
        triggers = await storage.getItem("triggers");

        if (!zones) {
            zones = getInitialZones();
            await storage.setItem("zones", zones);
        }

        if (!logs) {
            logs = [];
            await storage.setItem("logs", logs);
        }

        if (!triggers) {
            triggers = [];
            await storage.setItem("triggers", triggers);
        }

        if (!relays) {
            relays = getInitialRealays();
            await storage.setItem("relays", relays);
        }

        console.log("Storage initialized..");
    } catch (error) {
        console.log("Error initializiing storage: " + error);
    }
}

initStorage();

async function updateZone(zone) {
    if (!zone.id) {
        return null;
    }

    if(zones[zone.id] === undefined) {
        console.log("Zone does not exist.");
        return null;
    }

    
    try {
        zones[zone.id].name = zone.name || zones[zone.id].name;
        zones[zone.id].description = zone.description || zones[zone.id].description;
        zones[zone.id].color = zone.color || zones[zone.id].color;
        zones[zone.id].enabled = zone.enabled || zones[zone.id].enabled;
        
        await storage.setItem("zones", zones);
        return zones;

    } catch (error) {
        console.log("Error updating zone: " + error);
        return null;
    }
}

async function getZones() {
    return zones;
}

async function setZones(newZones) {
    const notValid = Object.keys(zones).some((zone) => newZones[zone] === undefined || null);
    if (notValid) {
        console.log("Zones are not valid.");
        return null;
    }

    zones = newZones;

    try {
        await storage.setItem("zones", zones);
        return zones;
    } catch (error) {
        console.log("Error setting zones: " + error);
    }
    return null;
}

async function createTrigger(trigger) {
    if(!trigger.type || !trigger.zone ) {
        console.log("failed to create trigger, name, description, zone are requiered.")
        return null;
    }

    triggers.push({
        id: Date.now().toString(),
        type: trigger.type,
        zone: trigger.zone,
        resolved: false,
        remarks: null,
        triggerTime: Date.now(),
        resolveTime: null
    });

    try {
        
        await storage.setItem("triggers", triggers);
        await createLog({type: `trigger`, description: `Sensor of zone: '${trigger.zone}', triggered.`});
        return triggers;

    } catch (error) {
        console.log("Error creating trigger: "+ error);
    }
    return null;
}

function getTriggers() {
    return triggers;
}

async function createLog(log) {
    if(!log.type || !log.description) {
        console.log("provide type and description at log");
        return null;
    }

    try {
        logs.push({
            id: "log-"+Date.now().toString(),
            type: log.type,
            description: log.description,
            date: Date.now(),
        });

        await storage.setItem('logs', logs);
        return logs;
    } catch (error) {
        console.log("Error creating log: "+ error);
    }
    return null;
}

async function resolveTrigger(data) {
    if(!data.id || !data.remarks) {
        console.log("failed to resolve trigger: id and remarks are required.")
        return null;
    }

    let newTrigger = triggers.find((trigger) => trigger.id === data.id && trigger.resolved === false);

    if(!newTrigger){
        console.log("failed to resolve trigger: trigger not found.");
        return null;
    }

    newTrigger.remarks = data.remarks;
    newTrigger.resolveTime = Date.now();
    newTrigger.resolved = true;
    triggers = triggers.map((trigger)=> trigger.id === data.id ? newTrigger : trigger);
    try {
        
        await storage.setItem("triggers", triggers);
        await createLog({type: `resolve`, description: `Trigger of zone: '${newTrigger.zone}', resolved.`});
        return triggers;
    } catch (error) {
        console.log("Error resolving trigger: "+ error);
    }
    return null;
}

function getLogs() {
    return logs;
}

module.exports = { initStorage, updateZone, getZones, setZones, getTriggers, createTrigger, createLog, resolveTrigger, getLogs };
