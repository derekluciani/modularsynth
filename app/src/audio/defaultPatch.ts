export const DEFAULT_PATCH = {
    "name": "Basic Patch",
    "patchID": 1764165557952,
    "modules": {
        "amp": {
            "gain": 0.5
        },
        "speaker": {
            "volume": -6,
            "pan": 0,
            "isMuted": false
        },
        "filter-2": {
            "cutoff": 20,
            "res": 0.1,
            "type": "lowpass"
        },
        "distort": {
            "drive": 0,
            "amount": 0,
            "oversample": "4x"
        },
        "delay": {
            "time": 0.01,
            "feedback": 0.001
        },
        "osc-4": {
            "freq": 20,
            "type": "sawtooth",
            "level": 0
        },
        "random": {
            "rate": 0.1,
            "level": 0
        },
        "lfo-3": {
            "freq": 0.1,
            "amount": 0,
            "type": "sine"
        },
        "lfo-2": {
            "freq": 0.1,
            "amount": 0,
            "type": "sine"
        },
        "lfo-1": {
            "freq": 0.1,
            "amount": 0,
            "type": "sine"
        },
        "osc-3": {
            "freq": 20,
            "type": "sawtooth",
            "level": 0
        },
        "osc-2": {
            "freq": 20,
            "type": "sawtooth",
            "level": 0
        },
        "osc-1": {
            "freq": 110.42746817631536,
            "type": "sawtooth",
            "level": 0.2
        },
        "filter-1": {
            "cutoff": 1011.6493240062277,
            "res": 0.9968894917736366,
            "type": "lowpass"
        }
    },
    "connections": [
        {
            "sourceId": "amp",
            "sourceNode": "output",
            "destId": "speaker",
            "destInput": "input"
        },
        {
            "sourceId": "filter-1",
            "sourceNode": "output",
            "destId": "amp",
            "destInput": "input"
        },
        {
            "sourceId": "osc-1",
            "sourceNode": "output",
            "destId": "filter-1",
            "destInput": "input"
        }
    ]
};
